# Lovable 部署詳細步驟（連 Supabase · 多裝置共享）

呢份係為「英文介詞遊戲 Preposition Game」React 專案而設，由零到上線。你已經熟 Lovable（家庫 Ai 同一套 stack），所以重點放喺**搬現成 code 入 Lovable** 同**駁 Supabase** 兩件事。

全程約 15–20 分鐘。需要：一個 Lovable 帳戶、一個 Supabase 帳戶（都有免費額度）。

---

## 總覽（4 大步）
1. **Supabase**：開 project → 跑一次 SQL 建表 → 攞 URL + anon key
2. **入 code 落 Lovable**：建議經 GitHub import（最穩陣）
3. **駁 Supabase + 填環境變數**
4. **Publish → 攞連結**

---

## 步驟 1 ｜ Supabase 後端（5 分鐘）

1. 去 https://supabase.com → **New project**。
   - Name：`preposition-game`（隨便）
   - Database Password：set 一個（記低，但 app 唔會直接用到）
   - Region：揀 **Southeast Asia (Singapore)**，對香港最快
2. 等 project 建立（約 1–2 分鐘）。
3. 左側 **SQL Editor** → **New query** → 打開本專案嘅 `supabase/schema.sql`，**全部複製貼上** → 撳 **Run**。
   - 見到 `Success. No rows returned` 就啱，表 `submissions` 同 `questions` 已建好，並開咗課堂用嘅 RLS 政策。
4. 左側 **Project Settings**（齒輪）→ **API**，記低兩個值：
   - **Project URL** → 即 `VITE_SUPABASE_URL`
   - **Project API keys → `anon` `public`** → 即 `VITE_SUPABASE_ANON_KEY`
   > ⚠️ 只用 `anon public` key，**唔好**用 `service_role`（嗰個係機密，唔可放前端）。

---

## 步驟 2 ｜ 將 code 入落 Lovable

Lovable 由 GitHub 讀 code 最穩陣。兩條路揀一條：

### 路線 A（推薦）：GitHub → Lovable
1. 去 github.com → **New repository** → 名 `preposition-game` → Create。
2. 喺 repo 版面撳 **「uploading an existing file」**（唔使裝 git）：
   - 將本專案解壓後嘅**所有檔案同資料夾**（`src/`、`index.html`、`package.json`、`supabase/`、設定檔…）拖入去。
   - 下面撳 **Commit changes**。
3. 去 lovable.dev → 開 project → 揀 **GitHub**（或 project 設定入面嘅 **Connect to GitHub / Import repo**）→ 揀啱頭先個 repo。
   - Lovable 會同你個 GitHub repo 雙向同步，之後喺 Lovable 改完可以 push 返 GitHub。

### 路線 B：直接喺 Lovable 新建再貼
如果唔想掂 GitHub：
1. Lovable 開一個新 **Vite + React + TS** project。
2. 用佢嘅檔案編輯器，照住本專案結構逐個建立／貼上 `src/**` 同設定檔內容。
> 路線 A 快好多、又唔會漏檔，建議用 A。

---

## 步驟 3 ｜ 駁 Supabase + 環境變數

Lovable 原生支援 Supabase，兩個做法：

### 做法 1：Lovable 內建 Supabase 整合（最簡單）
1. Lovable project 入面揀 **Supabase**（通常喺右上或 Settings → Integrations）→ **Connect Supabase** → 授權 → 揀頭先個 `preposition-game` project。
2. 連咗之後，Lovable 會自動注入 Supabase 連線資料。
   > 但注意：我哋個 code 係讀 **`import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`**。所以仍然建議喺下面「做法 2」補上呢兩個環境變數，確保 code 讀到。

### 做法 2：直接填環境變數（最穩陣，一定 work）
喺 Lovable 的 **Project Settings → Environment Variables**（或 `.env`）加：
```
VITE_SUPABASE_URL=https://你的專案.supabase.co
VITE_SUPABASE_ANON_KEY=你的 anon public key
```
（可選，開 AI 深入批改先要——見下面步驟 5）：
```
VITE_AI_ENDPOINT=https://你的專案.supabase.co/functions/v1/grade
```
填完 **重新 build / restart preview**，等變數生效。

---

## 步驟 4 ｜ 測試 + Publish

1. 喺 Lovable preview 開 app：
   - **學生**分頁：揀題型 → 打一句（例 `I am the girl in a dress`）→ 撳「檢查句子」→ 通過即出人物 → 「交畀老師」。
   - 如果「交畀老師」成功、冇紅色錯誤 → Supabase 已駁通 ✅
   - **老師**分頁：應該即刻見到頭先交嗰份作品。
   - **全班競猜**：撳「重新收集作品」→ 應該出到學生嘅作品 + 創作者名。
2. 撳 Lovable 右上 **Publish** → 得到一條 `xxx.lovable.app` 公開連結。
3. 連結貼去班群 / email / 學校內聯網即用。

---

## 步驟 5（可選）｜ 開 AI 深入批改

唔開都得——規則引擎已覆蓋句式、介詞、拼寫、性別、不雅用語。想要 AI 處理更自由嘅句子先做：

1. 需要 Supabase CLI（或用 Supabase Dashboard 的 Edge Functions 介面）部署 `supabase/functions/grade`。
2. 用 CLI：
   ```bash
   npx supabase login
   npx supabase link --project-ref 你的project-ref
   npx supabase functions deploy grade --no-verify-jwt
   npx supabase secrets set OPENAI_API_KEY=sk-...
   ```
3. 喺 Lovable 環境變數加 `VITE_AI_ENDPOINT=https://你的專案.supabase.co/functions/v1/grade` → 重新 build。
4. 之後學生撳「🤖 AI 檢查句子」就會行你個 endpoint（API key 只留喺 Supabase 伺服器，唔會出前端）。
   > 想用 Anthropic / Gemini 就改 `supabase/functions/grade/index.ts` 入面嗰個 fetch block。

---

## 常見問題

| 症狀 | 原因 / 解決 |
|---|---|
| 「交畀老師」紅字 `未連接 Supabase` | 環境變數冇填或未 restart。檢查 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`，再 rebuild。 |
| 交到但老師睇唔到 | SQL 未跑／RLS 未開。重跑 `supabase/schema.sql`。 |
| `permission denied for table` | RLS policy 冇建。確認 schema.sql 尾段 `create policy ...` 有執行。 |
| build error 關於 env | Lovable 要變數以 `VITE_` 開頭先會 expose 到前端——照本指南命名即可。 |
| AI 掣撳咗冇反應 | `VITE_AI_ENDPOINT` 未設定（屬正常，功能關閉）；或 Edge Function 未部署。 |

---

## 之後更新 code 點算？
- **路線 A（GitHub）**：喺 Lovable 改 → push 返 GitHub；或喺 GitHub 改 → Lovable 自動 sync。
- 我哋嘅引擎（批改 `check.ts` / 拼砌 `Avatar.tsx` / 競猜 `game.ts`）都係純前端，改完 Lovable 會自動 rebuild preview，確認冇問題先 Publish。

搞掂！有任何一步卡住，將錯誤訊息或截圖貼返畀我，我即刻幫你 debug。
