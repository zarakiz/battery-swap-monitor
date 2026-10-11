# 換電觀測站

台灣 Gogoro GoStation 與 Ionex 換電站的每日增減監測網站。

- 線上網站：https://zarakiz.github.io/battery-swap-monitor/
- 資料來源：
  - Gogoro：官方 `PartnerService/GetVmList` API
  - Ionex：官方 `api.ionex.com.tw/location`
- 更新頻率：1天/次
- 部署：GitHub Pages（靜態網站）

## 網站功能

- 雙網絡總站數趨勢折線圖、每日新增／移除群組直條圖（Chart.js）
- 每日異動明細：依日期分組的可收合卡片，含新增／移除／異動；暫停服務站點顯示維護公告（原因＋起訖時間）
- 明暗模式切換（localStorage 記憶）、RWD（含手機版 sticky 篩選摘要列）

## 運作原理

`fetch_all.py` 每天抓取雙網絡官方站點 API，將完整快照存於 `data/<network>/snapshots/`，
並與「今天之前最新」的一份快照比對（只比對基準快照實際擁有的欄位，避免 schema 變動誤判），產出：

- `data/<network>/daily/YYYY-MM-DD.json` — 當日新增／移除／異動站點
- `data/<network>/trends.json` — 趨勢圖用每日統計
- `data/manifest.json` — 全站索引（更新日期、可用日期區間、各網絡資訊）

網站為純靜態頁面（`index.html` + `styles.css` + `app.js`），直接讀取 `data/` 下的 JSON 呈現。

自動化排程（cron `swap-stations-daily`，每日 05:06 Asia/Taipei）：

1. `daily_update.sh` → `fetch_all.py`（抓取＋比對）
2. `git_push.sh` → 經 SSH deploy key 推送 `site/` 到 GitHub（`push_site.py` 僅供手動推送）
