// npm install express
// npm install qrcode
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// 驗證碼設定
const PASSWORD = 'coconut30050city';
const VERIFIED_LOG = path.join(__dirname, 'verified_ballots.json');
const ALL_CODES_LOG = path.join(__dirname, 'all_scans.log');

// 載入已驗證紀錄
let verifiedRecords = {};
try {
    const data = fs.readFileSync(VERIFIED_LOG, 'utf8');
    verifiedRecords = JSON.parse(data);
} catch (e) {
    verifiedRecords = {};
}

// 讀取 Excel 持分資料（簡化版，實際可整合 voter.html 邏輯）
let houseShares = {};
function loadHouseData() {
    // 目前先提供範例資料，可後續擴充讀取 household_ratio.xlsm
    houseShares = {
        'A1-1': '0.543',
        'A1-2': '0.512',
        'A2-1': '0.600'
    };
}
loadHouseData();

// 記錄掃描
function logScan(code, result) {
    const entry = {
        timestamp: new Date().toISOString(),
        code,
        result
    };
    fs.appendFileSync(ALL_CODES_LOG, JSON.stringify(entry) + '\n');
}

// 解析驗證碼：密碼 + YYYYMMDDHHmm + 戶號
function parseCode(code) {
    if (!code || code.length < 16) return null;
    
    const pwdLen = PASSWORD.length;
    const pwdPart = code.substring(0, pwdLen);
    if (pwdPart !== PASSWORD) {
        return { valid: false, message: '密碼錯誤或格式不符' };
    }
    
    const timePart = code.substring(pwdLen, pwdLen + 12);
    const house = code.substring(pwdLen + 12);
    
    // 驗證時間格式
    if (!/^\d{12}$/.test(timePart)) {
        return { valid: false, message: '時間格式錯誤' };
    }
    
    // 檢查戶號是否有效（可擴充）
    if (!house || house.trim() === '') {
        return { valid: false, message: '戶號缺失' };
    }
    
    return {
        valid: true,
        house,
        timePart,
        timestamp: timePart,
        share: houseShares[house] || '未知'
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
    
    // 檢查是否已投票
    if (verifiedRecords[code]) {
        logScan(code, 'duplicate');
        return res.json({
            valid: false,
            message: '此表決票已被驗證過（重複投票）',
            house: parsed.house,
            timestamp: verifiedRecords[code].timestamp
        });
    }
    
    // 記錄驗證成功
    verifiedRecords[code] = {
        house: parsed.house,
        share: parsed.share,
        timePart: parsed.timePart,
        verifiedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(VERIFIED_LOG, JSON.stringify(verifiedRecords, null, 2));
    logScan(code, 'verified');
    
    res.json({
        valid: true,
        house: parsed.house,
        share: parsed.share,
        timestamp: parsed.timePart,
        message: '表決票驗證成功，已記錄'
    });
});

// 取得統計
app.get('/stats', (req, res) => {
    res.json({
        totalVerified: Object.keys(verifiedRecords).length,
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
