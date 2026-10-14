# GitHub 星圖 · GitHub Starmap

貼上 GitHub 帳號（`github.com/xxx`、`@xxx` 或 `xxx`），把那個帳號做過的 repo 和收藏的 Star 畫成一張 3D 關係圖，再附一張趣味評分卡。

Paste a GitHub account and get its repos and stars as a 3D star map, plus a just-for-fun score card. Traditional Chinese and English.

## 隱私：只讀公開資料

- **不存任何資料**，也不需要登入。星圖、分類與評分都在你的瀏覽器裡算。
- 瀏覽器直接呼叫 GitHub 公開 API（不帶 token）：`/users/{u}`、`/users/{u}/repos?type=owner`、`/users/{u}/starred`。
- 唯一的伺服器端程式是分享連結的預覽圖（`api/og.ts`、`api/share.ts`）：分享網址 `/s/<帳號>?m=&c=&s=` 本身帶著稱號代碼和分數，函式只用這些產生圖片；它不呼叫 GitHub API、沒有金鑰、不寫入任何資料，只會向 github.com 取那個帳號的公開頭像。
- 讀到的結果只存在**你自己的瀏覽器**（localStorage，1 小時後失效），重整不必重抓。
- GitHub 限制每位訪客每小時 60 次查詢；查一個帳號約需 3～21 次（Star 最多讀 1,000 個）。

## 功能

- 3D 圖：點分類或主題，側邊面板列出相關的專案與 Star；可搜尋、點圖例隱藏群組，按 Esc 回全景。
- 規則分類：20 個分類、91 個主題，比對 topics（權重最高）、repo 名稱、描述與語言；完全沒有關鍵字時才依主要語言推測分類（不給主題，也不算進專注度與稱號）。兩組測試資料：
  - 257 個人工標註的 Star（偏 AI 繪圖與 AI 工具）：分類命中率 82.9%，主題至少命中一個 94.3%。
  - 15 位不同領域知名開發者的公開 repo 與 Star 抽樣 1,330 筆：落在「其他」的自己 repo 5.6%、Star 1.7%（調整前分別是 57% 與 42%）。
- 洞察：最常收藏的主題、做過也收藏的主題、只收藏還沒動手的主題。
- 趣味評分（好玩而已，不是正式評分，公式在頁面上公開）：

| 分數 | 公式 |
|---|---|
| 動手率 | 收藏涉及的主題中，自己的 repo 也有的比例 |
| 挖寶指數 | 收藏的 repo 中，星數不到 1,000 的比例 |
| 專注度 | 最大分類在「Star＋自己的 repo」中的占比（不含「其他」和只靠語言推測分類的項目） |
| 收藏廣度 | 收藏涵蓋的主題數 ÷ 全部 91 個主題 |
| 近期活躍度 | 60 × min(1, 近 90 天推送過的 repo 數 ÷ 5) ＋ 40 × min(1, 近 90 天新收藏數 ÷ 30) |

  稱號＝最高分那一項的修飾語＋最大分類的身分，例如「雜食系煉圖師」。fork 不計分。
- 分享：
  - 網址 `?u=帳號` 開啟就載入；從別人的連結進來時會邀請你生成自己的星圖。
  - 分享出去的連結會帶專屬預覽卡：貼到 X、Discord、LINE、Facebook 時直接顯示那個人的頭像、稱號與五角雷達。
  - 「我的星座海報」先預覽 1080×1350 海報（個人星座圖、五角雷達、星圖小發現），再用手機原生分享、下載、複製圖片、複製文案＋連結，或分享到 X／Threads／Facebook／LINE。
  - 時光回放：星星依收藏與建立時間依序亮起，播完可直接分享。
  - 拍照模式：藏起所有面板，只留星圖與帶網址的浮水印，方便截圖或錄影。

## 開發

```bash
npm install
npm run dev          # 本機開發
npm test             # Vitest：連結解析、分類命中率、「其他」比例、評分、API 與快取
npm run test:e2e     # Playwright：以攔截路由模擬 GitHub API，不耗真實額度
npm run build        # 型別檢查 + 打包到 dist/
```

E2E 需要 Playwright 的 Chromium（`npx playwright install chromium`）；3D 圖在無頭模式下以 SwiftShader 軟體 WebGL 執行。

## 技術

Vite、TypeScript（無框架）、[3d-force-graph](https://github.com/vasturiano/3d-force-graph)、three-spritetext。預覽圖用 [@vercel/og](https://vercel.com/docs/og-image-generation)；中文字型是 Noto Sans TC（SIL OFL 1.1，見 `api/_fonts/OFL.txt`）只取預覽圖會出現的 208 個字，重建方式見 `scripts/build-og-fonts.py`。three.js 另外切成延遲載入的區塊，首頁只載入約 23 KB（gzip）的 JS。

## 授權

MIT，見 [LICENSE](LICENSE)。

本專案與 GitHub 無關，非官方產品。
