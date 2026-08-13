## voter - 社區區權會之議案表決票產生與驗證系統

### voter.html - 議案表決票產生器

### qr_server.js - 表決票驗證服務器
```
cd ~/VibeCoding/voter
npm install express
npm install qrcode
node qr_server.js
```

### qr_verifier.html - 表決票QR掃描驗證器
`http://localhost:3000/qr_verified.html` <br>
