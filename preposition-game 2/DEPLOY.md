# 網上部署指南（唔使 Cursor / 唔使本地 IDE）

呢個專案係標準 Vite + React + TS，任何支援 Node 的平台都部署到。下面四種方法由淺入深，全部**喺瀏覽器入面完成**，唔使裝 Cursor 或任何本地工具。

共通一步：**所有平台都要填 2 個環境變數**（Supabase，用嚟多裝置共享）：
```
VITE_SUPABASE_URL      = https://你的專案.supabase.co
VITE_SUPABASE_ANON_KEY = 你的 anon public key
（可選）VITE_AI_ENDPOINT = https://你的專案.supabase.co/functions/v1/grade
```
Supabase 設定見 `README.md` 第 2 節（SQL Editor 貼 `supabase/schema.sql` 跑一次即可）。

---

## 方法 1 ⭐ Lovable（你已經熟，最快）
最啱你——同 kafuai 一樣嘅流程，連 Supabase 原生支援。
1. 去 lovable.dev → 開新 project。
2. 將呢個 `preposition-game` 資料夾嘅內容放上去：
   - 最簡單：用 Lovable 嘅 **GitHub import**（見方法 2 先 push 上 GitHub，再喺 Lovable「Connect/Import GitHub」揀個 repo）。
   - 或者將 zip 解壓後，把 `src/`、`index.html`、設定檔逐個貼／上載。
3. 喺 Lovable 的 **Project Settings → Environment Variables** 填上面 3 個變數。
4. Lovable 內建 Supabase 整合——connect 你個 Supabase project 就得。
5. Publish → 得到一條公開網址，貼去班群即用。

## 方法 2 ⭐ GitHub + Vercel（最穩陣、免費、唔使本地）
完全喺網頁做：
1. **上 GitHub**：github.com → New repository → 揀「uploading an existing file」→ 將解壓後嘅檔案拖上去 commit。（唔使 git 指令、唔使 Cursor）
2. **Vercel**：vercel.com 用 GitHub 登入 → Add New → Project → 揀個 repo。
3. Framework 會自動偵測做 **Vite**；Build = `npm run build`，Output = `dist`（預設啱）。
4. **Environment Variables** 填上面 3 個 → Deploy。
5. 完成，得到 `xxx.vercel.app` 網址。之後喺 GitHub 改檔，Vercel 自動重新部署。

## 方法 3 Netlify（可以用拖放，唔使 GitHub）
如果你想完全唔掂 GitHub：
1. 先要有一次 build 出嚟嘅 `dist/`。冇本地環境嘅話，用方法 4（StackBlitz）喺網上 build，或者叫我幫你出一個 `dist`。
2. app.netlify.com → **Deploys** → 將 `dist/` 資料夾直接拖入去 → 即刻上線。
3. 環境變數：Site settings → Environment variables（如果用拖放純靜態，Supabase 變數要喺 build 時已經入咗；建議用 GitHub import 方式等 Netlify 幫你 build）。
> 想要自動化，Netlify 都支援 GitHub import，步驟同方法 2 一樣。

## 方法 4 StackBlitz（純網頁，即時預覽，免安裝）
最快睇到行緊：
1. stackblitz.com → 可以直接 **Import from GitHub**（配方法 2），或建立新 Vite React 專案再貼檔案。
2. 喺 StackBlitz 的 `.env` 填環境變數。
3. 佢即時喺瀏覽器行起個 dev server，可以 share 連結。
> StackBlitz 啱快速試玩／示範；長期公開建議用 Vercel/Netlify/Lovable。

---

## 邊個適合你？
| 你想點 | 用邊個 |
|---|---|
| 同 kafuai 一樣流程、連 Supabase 最快 | **Lovable** |
| 最穩陣、免費、改咗自動更新 | **GitHub + Vercel** |
| 唔想掂 GitHub、想拖放 | **Netlify** |
| 只係想即刻喺瀏覽器試 | **StackBlitz** |

部署任何一個之前，記得先完成 `README.md` 第 2 節嘅 Supabase 建表，否則「交畀老師／全班競猜」會因為冇後端而停用（批改同出圖就照用）。
