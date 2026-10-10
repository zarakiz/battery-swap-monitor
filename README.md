# GoStation 每日異動追蹤

每日自動追蹤 Gogoro 全台換電站（GoStation）的站點新增、移除與資料異動，並以數據化方式呈現。

- 資料來源：Gogoro Network 官方換電站 API（`network.gogoro.com` 前端所使用的官方端點）
- 更新頻率：每日自動抓取快照並比對差異
- 部署：GitHub Pages（靜態網站）

## 運作原理

`fetch.py` 每天抓取官方站點 API，將完整快照存檔，並與前一日快照比對，產出：
- `data/daily/YYYY-MM-DD.json` — 當日新增 / 移除 / 異動站點（含完整站點資訊）
- `data/latest.json` — 最新全量站點（網站搜尋用）
- `data/manifest.json` — 每日統計索引（趨勢圖用）

網站為純靜態頁面（`index.html` + `styles.css` + `app.js`），直接讀取 `data/` 下的 JSON 呈現。
