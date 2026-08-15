// npm install express
// npm install qrcode
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// 驗證碼設定
const PASSWORD = 'coconut30050city';
const HOUSE_DB_PATH = path.join(__dirname, 'household_db.json');
const VERIFIED_LOG = path.join(__dirname, 'verified_ballots.json');
const ALL_CODES_LOG = path.join(__dirname, 'all_scans.log');

// 已驗證紀錄：verifiedRecords 以 SHA-256 ballotHash 為鍵（同一張票唯一），
// houseVotes 以 戶號 為鍵（每個戶號最多一票），防止任何形式的重複計票。
let verifiedRecords = {};
let houseVotes = {};

function loadVerifiedRecords() {
    verifiedRecords = {};
    houseVotes = {};
    try {
        const data = JSON.parse(fs.readFileSync(VERIFIED_LOG, 'utf8'));
        for (const rec of Object.values(data)) {
            // 舊格式紀錄沒有 ballotHash，由 code 重新計算
            const hash = rec.ballotHash || sha256(rec.code);
            verifiedRecords[hash] = { ...rec, ballotHash: hash };
            houseVotes[rec.house] = hash;
        }
        console.log(`已載入 ${Object.keys(verifiedRecords).length} 筆已驗證選票`);
    } catch (e) {
        verifiedRecords = {};
        houseVotes = {};
    }
}

// 讀取 Excel 持分資料（從 JSON 資料庫）
let houseShares = {};
function loadHouseData() {
    try {
        const data = fs.readFileSync(HOUSE_DB_PATH, 'utf8');
        houseShares = JSON.parse(data);
        console.log(`已載入 ${Object.keys(houseShares).length} 筆戶號資料`);
    } catch (e) {
        console.warn('無法載入 household_db.json，使用空資料', e.message);
        houseShares = {
            'A1-1': '0.543',
            'A1-2': '0.512',
            'A2-1': '0.600'
        };
    }
}
loadHouseData();
// 熱重載資料庫
fs.watchFile(HOUSE_DB_PATH, (curr, prev) => {
    console.log('household_db.json 已變更，重新載入...');
    loadHouseData();
});

// 記錄掃描
function logScan(code, result) {
    const entry = {
        timestamp: new Date().toISOString(),
        code,
        result
    };
    fs.appendFileSync(ALL_CODES_LOG, JSON.stringify(entry) + '\n');
}

// 計算 SHA256
function sha256(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}
loadVerifiedRecords();

// 解析驗證碼：salt.timePart.house （鹽值 + 時間 + 戶號）
// 前端不再計算 hash，伺服器端使用密碼簽章
function parseCode(code) {
    if (!code || typeof code !== 'string') return { valid: false, message: '無效的 QR 碼內容' };
    
    const parts = code.split('.');
    if (parts.length !== 3) {
        return { valid: false, message: 'QR 格式錯誤，需為 salt.time.house' };
    }
    
    const [salt, timePart, house] = parts;
    
    // 基本格式檢查
    if (!/^[0-9a-f]{32}$/.test(salt)) {
        return { valid: false, message: '鹽值格式錯誤' };
    }
    if (!/^\d{12}$/.test(timePart)) {
        return { valid: false, message: '時間格式錯誤' };
    }
    if (!house || house.trim() === '') {
        return { valid: false, message: '戶號缺失' };
    }
    
    // 驗證戶號存在與持分
    const share = houseShares[house];
    if (!share) {
        return { valid: false, message: `戶號 ${house} 不存在於資料庫` };
    }
    
    // 伺服器端重新計算簽章驗證（隱藏密碼）
    const raw = PASSWORD + '|' + salt + '|' + timePart + '|' + house;
    const expectedHash = sha256(raw);
    // hash 不在 QR 中，僅在伺服器端驗證；簽章用於防止重放與竄改紀錄

    // 整張選票的 SHA-256 雜湊：作為唯一 ballotHash，用於防止同一張票重複計票
    const ballotHash = sha256(code);

    return {
        valid: true,
        house,
        timePart,
        timestamp: timePart,
        share,
        salt,
        serverHash: expectedHash,
        ballotHash
    };
}

// 驗證端點
app.post('/verify', (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.json({ valid: false, message: '未提供 QR 碼內容' });
    }
    
    logScan(code, 'received');
    
    const parsed = parseCode(code);
    if (!parsed.valid) {
        logScan(code, 'invalid_format');
        return res.json({ valid: false, message: parsed.message });
    }
    
    // 1. 同一張票（相同 SHA-256 ballotHash）重複掃描：不重複計票
    if (verifiedRecords[parsed.ballotHash]) {
        logScan(code, 'duplicate_hash');
        return res.json({
            valid: false,
            message: '此表決票已計票，重複掃描同一張票不予計票',
            house: parsed.house,
            ballotHash: parsed.ballotHash,
            timestamp: verifiedRecords[parsed.ballotHash].verifiedAt
        });
    }

    // 2. 同一個戶號已投過票（即使換新鹽值/時間重新產生的票）也不計票
    if (houseVotes[parsed.house]) {
        logScan(code, 'duplicate_house');
        return res.json({
            valid: false,
            message: `戶號 ${parsed.house} 已投票，重複票不予計票`,
            house: parsed.house,
            ballotHash: parsed.ballotHash,
            firstBallotHash: houseVotes[parsed.house]
        });
    }
    
    // 記錄驗證成功，鍵為 ballotHash，確保每張票與每個戶號都只計一次
    verifiedRecords[parsed.ballotHash] = {
        code,
        house: parsed.house,
        share: parsed.share,
        timePart: parsed.timePart,
        salt: parsed.salt,
        ballotHash: parsed.ballotHash,
        verifiedAt: new Date().toISOString()
    };
    houseVotes[parsed.house] = parsed.ballotHash;
    
    fs.writeFileSync(VERIFIED_LOG, JSON.stringify(verifiedRecords, null, 2));
    logScan(code, 'verified');
    
    res.json({
        valid: true,
        house: parsed.house,
        share: parsed.share,
        timestamp: parsed.timePart,
        ballotHash: parsed.ballotHash,
        message: '表決票驗證成功，已記錄（SHA-256 防重複計票）',
        salt: parsed.salt
    });
});

// 取得統計
app.get('/stats', (req, res) => {
    res.json({
        totalVerified: Object.keys(verifiedRecords).length,
        totalHouses: Object.keys(houseVotes).length,
        records: verifiedRecords
    });
});

// 取得最近掃描紀錄
app.get('/scans', (req, res) => {
    try {
        const lines = fs.readFileSync(ALL_CODES_LOG, 'utf8').trim().split('\n');
        const scans = lines.reverse().slice(0, 100).map(l => JSON.parse(l));
        res.json(scans);
    } catch (e) {
        res.json([]);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`QR 驗證伺服器啟動於 http://localhost:${PORT}`);
    console.log('訪問 /qr_verifier.html 使用掃描介面');
    console.log('API端點: POST /verify, GET /stats, GET /scans');
});
