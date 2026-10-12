# 換電觀測站

台灣 Gogoro GoStation 與 Ionex 換電站的每日增減監測網站。

- 線上網站：https://zarakiz.github.io/battery-swap-monitor/
- 資料來源：Gogoro / Ionex 官方站點 API
- 更新頻率：每日 05:06（台灣時間）自動抓取、比對並部署
- 部署：GitHub Pages（靜態網站）

## 運作方式

每天抓取雙網絡的完整站點快照，與前一日比對站點 ID，產出新增／移除／異動清單；
網站讀取這些 JSON 呈現趨勢圖與每日明細。
