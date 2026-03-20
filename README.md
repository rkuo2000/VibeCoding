# Vibe Coding
**Paper**: [Vibe Coding vs Agentic Coding](https://arxiv.org/html/2505.19443v1)<br>
![](https://arxiv.org/html/2505.19443v1/x2.png)
![](https://arxiv.org/html/2505.19443v1/x3.png)

---
## App 範例

### App 服務器
1. 將AI產生的html (例如: ai_studio_code.html) 複製到 index.html
2. 執行`python main.py` (提供HTTPS Server)
3. 以電腦或手機打開Chrome瀏覽器，輸入`https://127.0.0.1:8000` 或 `https://192.168.0.14:8000` (192.168.0.14 是PC連網的位址）

---
### [alphabet.html](https://rkuo2000.github.io/app-alphabet/)
```
寫出一個網頁給幼兒園學習26個英文字母，搭配單字，要能發出聲音與顯示圖片，要加上RWD
```

---
### [jp_alphabet.html](https://rkuo2000.github.io/app-jp-alphabet/)
```
寫出一個網頁給幼兒園學習日文字母，搭配單字，要能發出聲音與顯示圖片，要加上RWD
```

### [alchemy.html](https://rkuo2000.github.io/app-alchemy/)
```
寫一個html 以國中化學為內容，產生一個小小煉金術師實驗室，可選擇化學基本元素及顯示其圖片，選定元素後進行合成或重置，並以web3D產生動畫，
顯示最後之合成物的分子結構，及此合成物的圖片, 加上RWD, 合成鍋畫成一個古代爐鼎，無法合成時提示可合成之元素組成
```

### [heartbeat.html](https://rkuo2000.github.io/app-heartbeat/) `camera`
```
寫出一個html 使用webcam偵測人臉，利用rPPG演算法，感測出心跳BPM及顯示心跳波形,
加入band-pass filter, 加入RWD
```

---
### [camera_detect.html](https://rkuo2000.github.io/app-camera_detect/) `camera`
```
寫出一個html 使用webcam使用tensorflow.js做物件偵測
```

---
### [image_poem.html](https://rkuo2000.github.io/app-image_poem/) `camera` `gemini`
```
寫一個html 影像作詩系統，輸入主題的方式可選上傳照片或由webcam拍攝，選定輸入按鍵後使用Gemini辨識（輸入Gemini API) 並作詩一首，
最後產生照片與詩句結合的圖片，支援RWD
```

---
### [Vision Assistant](https://rkuo2000.github.io/vision-assistant/) `camera` `gemini`
```
寫出一個使用webcam 有擷取，詢問，朗讀 等按鍵，可輸入Gemini API Key, 及輸入模型名稱（default="gemini-2.5-flash")
```

---
### [polePID_sim.html](https://rkuo2000.github.io/app-polePID_sim/)
```
我是一個電機系學生，請幫我寫一個單軸橫桿平衡的PID模擬網頁工具。
1. 物理模型：模擬一個中間有支點的長桿，兩端有馬達推力。系統輸入為PID參數。
2. 參數輸入項：PID 增益（Kp, Ki, Kd)
  * 系統去樣時間（預設 0.02s)
  * 橫桿重量與長度（模擬慣性）
3. 視覺與動畫：
  * 網頁上方顯示一個橫桿的簡易動畫，會根據當前角度傾斜。
  * 使用Chart.js同步繪製角度隨時間變化的響應曲線（類似MATLAB模擬圖）
4. 功能按鍵：
  *『開始模擬』：讓橫桿從傾斜30度開始，由PID回正。
  *『重置』：恢復初始狀態。
5. 介面要求：使用繁體中文，介面要乾淨現代化（使用Tailwindd CSS渲染）。所有代碼整合在一個html檔案中。

---
### [galaxian](https://rkuo2000.github.io/app-galaxian)
**Blog**: [Galaxian 遊戲指南與開發更新](https://vocus.cc/article/697f7388fd89780001b59a98)<br>
**[Prompt](https://github.com/rkuo2000/VibeCoding/blob/main/galaxian.md)**<br>

