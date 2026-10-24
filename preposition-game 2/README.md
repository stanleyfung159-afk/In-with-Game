# 英文介詞遊戲 · Preposition Game

一個教小學生用 **in / with** 介詞描述人物（衣著／外貌／配件）的互動課堂 app。

- **零延遲出圖**：人物由分層 SVG 即場拼砌，**不用生成式 AI**，所以 100% 穩定、永不失敗、同一句永遠出同一個樣。
- **學生自己寫句**：句式 `I am the boy / girl in (clothing) with (appearance)`。只提供詞彙參考，**不提供可揀的現成句子**。
- **題型分級（包容不同程度）**：學生可揀「只用 in」「只用 with」或「in + with（進階）」；檢查按所揀題型放寬，淨用一個介詞都可過關。
- **先檢查、後出圖**：句子要先過關——句式、介詞（`in`/`with`）、拼寫、**性別代名詞一致**、**不雅／不友善用語**——冇問題先至生成人物。設定咗 AI endpoint 就由 AI 做權威檢查，否則用內建規則引擎。
- **全班競猜（創作者先出）**：先決條件係已收集學生作品；隨機次序，**先顯示創作者名並請佢出嚟讀句**，全班再猜 A/B 兩圖邊張啱 → 揭曉答案。干擾圖只改動一個句子真正講咗嘅屬性。
- **老師後台**：學生作品、全班統計、CSV / PDF 匯出、題庫。
- **多裝置共享**：靠 Supabase——學生各自喺自己部機交，老師任何地方都睇到全班。

> 關於「性別檢查」：只檢查**代名詞文法一致**（如講 boy 就唔用 she/her），**不會**把「男仔著 dress」當錯——衣著不設性別限制。

技術棧：**Vite + React + TypeScript + Tailwind + Supabase**（與 kafuai 同一套，直接落 Cursor 本地或 import Lovable）。

---

## 1. 安裝

```bash
npm install
cp .env.example .env     # 然後填入下面的金鑰
npm run dev              # http://localhost:5173
```

## 2. 設定 Supabase（多裝置共享的關鍵）

1. 去 https://supabase.com 開一個免費專案。
2. **SQL Editor** → 貼上 `supabase/schema.sql` 全部內容 → **Run**。會建立 `submissions` 同 `questions` 兩張表，並開好（課堂用的）RLS 政策。
3. **Project Settings → API**，複製兩個值落 `.env`：
   ```
   VITE_SUPABASE_URL=https://你的專案.supabase.co
   VITE_SUPABASE_ANON_KEY=你的 anon public key
   ```
4. 重啟 `npm run dev`。搞掂——學生交嘅作品會即時出喺老師後台。

> 未填 Supabase 金鑰都照跑：批改、出圖、全班競猜（用內建範例）全部正常，只係「交畀老師／共享題庫」會停用並顯示提示。

## 3.（可選）AI 深入批改

想要處理表格詞彙以外的自由句子，可部署 `supabase/functions/grade`：

```bash
supabase functions deploy grade --no-verify-jwt
supabase secrets set OPENAI_API_KEY=sk-...
```

然後喺 `.env` 加：
```
VITE_AI_ENDPOINT=https://你的專案.supabase.co/functions/v1/grade
```

API key 只留喺伺服器，唔會送到瀏覽器。想用 Anthropic / Gemini 就改 `grade/index.ts` 入面嗰個 fetch block 即可。留空 `VITE_AI_ENDPOINT` 則「AI 深入批改」掣會自動隱藏。

## 4. 部署成網站

Build 出嚟係純靜態檔，任何靜態主機都得：

```bash
npm run build      # 產出 dist/
```

- **Vercel / Netlify / Cloudflare Pages**：connect GitHub repo，framework 揀 Vite，build command `npm run build`，output `dist`，再喺平台的環境變數填返 `VITE_SUPABASE_*`（同 `VITE_AI_ENDPOINT`）。
- **Lovable**：將 `src/`、設定檔同 `package.json` import 入去；Supabase 係 Lovable 原生支援，連埋就得。

## 專案結構

```
src/
  App.tsx                  三個模式的外殼 + 分頁
  main.tsx / index.css     進入點 + 全域樣式
  lib/
    types.ts               共用型別
    vocab.ts               封閉詞彙 + 調色盤
    parser.ts              句子解析 + 規則批改引擎
    game.ts                競猜回合 + 干擾圖（翻轉一個屬性）
    report.ts              每生統計 + 錯誤分類
    supabase.ts            後端：submissions / questions CRUD（多裝置）
    ai.ts                  可選 AI 批改（打你自己的 endpoint）
    theme.ts               inline-style 主題
    download.ts            瀏覽器下載 helper（CSV / PDF）
  components/
    Avatar.tsx             分層 SVG 人物（含圖案 / 場景）
    StudentMode.tsx        寫句 → 批改 → 出圖 → 配對 → 交 → 我的紀錄
    ClassMode.tsx          全班雙圖競猜
    TeacherMode.tsx        學生作品 / 題庫 / 成績報表
    TeacherReport.tsx      PDF 成績表（含錯誤分析）
supabase/
  schema.sql               一次過建表 + RLS
  functions/grade/         可選 AI 批改 Edge Function 範例
```

## 課堂用法

1. **學生**分頁：自己打一句（例 `I am the boy in a t-shirt with short hair and glasses.`）→ 撳「檢查句子」→ 冇問題先生成人物 → 「交畀老師」。有問題會列出要改嘅地方，改好先出圖。
2. **全班競猜**分頁：按「重新收集作品」載入全班提交 → 投影 → 老師讀句，全班猜 A／B → 揭曉 → **彈出創作者名** → 請佢出嚟 present。
3. **老師**分頁：睇全班作品、統計、題庫、**成績報表**（匯出 PDF／CSV）。

> 註：schema 預設的 RLS 畀 anon key 直接讀寫，適合可信任的課堂／單一學校。若要老師登入分權，加 Supabase Auth 後再收緊 `supabase/schema.sql` 的 policy。
