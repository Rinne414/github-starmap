# GitHub 星圖 · GitHub Starmap

貼上 GitHub 帳號（`github.com/xxx`、`@xxx` 或 `xxx`），把那個帳號做過的 repo 和收藏的 Star 畫成一張 3D 關係圖，再附一張趣味評分卡。

Paste a GitHub account and get its repos and stars as a 3D star map, plus a just-for-fun score card. Traditional Chinese and English.

## 隱私：只讀公開資料

- 網站是純靜態頁面，**沒有後端、不存任何資料**，也不需要登入。
- 瀏覽器直接呼叫 GitHub 公開 API（不帶 token）：`/users/{u}`、`/users/{u}/repos?type=owner`、`/users/{u}/starred`。
- 讀到的結果只存在**你自己的瀏覽器**（localStorage，1 小時後失效），重整不必重抓。
- GitHub 限制每位訪客每小時 60 次查詢；查一個帳號約需 3～21 次（Star 最多讀 1,000 個）。

## 功能

- 3D 圖：點分類或主題，側邊面板列出相關的專案與 Star；可搜尋、點圖例隱藏群組，按 Esc 回全景。
- 規則分類：20 個分類、82 個主題，比對 topics（權重最高）、repo 名稱、描述與語言。用 257 個人工標註的 Star 測過：分類命中率 84.4%，主題至少命中一個 94.3%。
- 洞察：最常收藏的主題、做過也收藏的主題、只收藏還沒動手的主題。
- 趣味評分（好玩而已，不是正式評分，公式在頁面上公開）：

| 分數 | 公式 |
|---|---|
| 動手率 | 收藏涉及的主題中，自己的 repo 也有的比例 |
| 挖寶指數 | 收藏的 repo 中，星數不到 1,000 的比例 |
| 專注度 | 最大分類在「Star＋自己的 repo」中的占比（不含「其他」） |
| 收藏廣度 | 收藏涵蓋的主題數 ÷ 全部 82 個主題 |
| 近期活躍度 | 60 × min(1, 近 90 天推送過的 repo 數 ÷ 5) ＋ 40 × min(1, 近 90 天新收藏數 ÷ 30) |

  稱號＝最高分那一項的修飾語＋最大分類的身分，例如「雜食系煉圖師」。fork 不計分。
- 分享：網址 `?u=帳號` 開啟就載入；評分卡可下載成 PNG。

## 開發

```bash
npm install
npm run dev          # 本機開發
npm test             # Vitest：連結解析、分類命中率、評分、API 與快取
npm run test:e2e     # Playwright：以攔截路由模擬 GitHub API，不耗真實額度
npm run build        # 型別檢查 + 打包到 dist/
```

E2E 需要 Playwright 的 Chromium（`npx playwright install chromium`）；3D 圖在無頭模式下以 SwiftShader 軟體 WebGL 執行。

## 技術

Vite、TypeScript（無框架）、[3d-force-graph](https://github.com/vasturiano/3d-force-graph)、three-spritetext。three.js 另外切成延遲載入的區塊，首頁只載入約 23 KB（gzip）的 JS。

## 授權

MIT，見 [LICENSE](LICENSE)。

本專案與 GitHub 無關，非官方產品。
