# voter

社區區權會議表決票產生與 QR 驗證系統

## 檔案說明
- `voter.html` : 前端選票產生器，讀取 Excel 持分檔產生帶 QR 的選票紙
- `qr_server.js` : Node.js 驗證伺服器，讀 `household_db.json` 驗證 QR
- `qr_verifier.html` : 相機掃描驗證介面
- `household_ratio.xlsm` : 住戶持分來源 Excel
- `household_db.json` : 伺服器用 JSON 資料庫，由 Excel 同步產生
- `sync_household.py` : Excel -> JSON 自動同步腳本

## 資料庫維護流程
1. 修改 `household_ratio.xlsm`
2. 執行同步：`python3 sync_household.py`
3. 伺服器會自動熱重載 `household_db.json`

## 安全改動
- 密碼僅存在伺服器端，不暴露於前端
- 簽章驗證在伺服器內部完成

## 啟動
```bash
node qr_server.js
# 前往 http://localhost:3000/qr_verifier.html 使用掃描介面
```

