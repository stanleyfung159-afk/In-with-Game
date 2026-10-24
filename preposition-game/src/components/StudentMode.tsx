import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { attrChips } from '../lib/parser';
import { precheck, PreCheckResult } from '../lib/check';
import { Submission, AiGrade } from '../lib/types';
import { aiGrade, aiEnabled } from '../lib/ai';
import {
  saveSubmission, savePref, getPref, listMySubmissions, storageMessage, isConfigured,
} from '../lib/supabase';
import { CLOTHING_IN, FEATURES_WITH } from '../lib/vocab';
import { T, card, btn, label, input } from '../lib/theme';

// Students MUST write their own sentence (no picking from a list).
// The avatar is generated ONLY after the sentence passes the pre-check gate
// (framework + grammar + spelling + gender consistency + appropriate language).

export const StudentMode: React.FC = () => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [sentence, setSentence] = useState('');
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<PreCheckResult | null>(null);
  const [ai, setAi] = useState<AiGrade | null>(null);
  const [aiErr, setAiErr] = useState('');
  const [unlocked, setUnlocked] = useState(false); // image + submit unlocked
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  const [history, setHistory] = useState<Submission[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [histState, setHistState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [histErr, setHistErr] = useState('');

  useEffect(() => {
    const n = getPref('studentName'); if (n) setName(n);
    const c = getPref('className'); if (c) setClassName(c);
  }, []);

  const attrs = check ? check.attrs : null;

  function reset() {
    setCheck(null); setAi(null); setAiErr(''); setUnlocked(false);
    setSaveState('idle');
  }

  async function review() {
    if (!sentence.trim()) return;
    reset();
    setChecking(true);
    const pc = precheck(sentence);
    setCheck(pc);

    // Hard block on foul language — never call AI, never generate.
    if (pc.blocked) { setUnlocked(false); setChecking(false); return; }

    // When an AI endpoint is configured, the AI is the authoritative reader.
    if (aiEnabled) {
      try {
        const g = await aiGrade(sentence);
        setAi(g);
        setUnlocked(pc.ok && g.correct);
      } catch (e) {
        setAiErr(e instanceof Error ? e.message : String(e));
        // fall back to the rule gate if the AI service is unreachable
        setUnlocked(pc.ok);
      }
    } else {
      setUnlocked(pc.ok);
    }
    setChecking(false);
  }

  async function loadHistory() {
    if (!name.trim()) { setHistErr('請先輸入你的名字先至睇到紀錄。'); setShowHistory(true); return; }
    setHistState('loading'); setHistErr(''); setShowHistory(true);
    try { setHistory(await listMySubmissions(name, className)); setHistState('idle'); }
    catch (e) { setHistState('error'); setHistErr(storageMessage(e)); }
  }

  async function submit() {
    if (!check || !attrs || !unlocked) return;
    if (!name.trim()) { setSaveState('error'); setSaveMsg('請先輸入你的名字 / enter your name'); return; }
    setSaveState('saving');
    try {
      savePref('studentName', name.trim());
      savePref('className', className.trim());
      await saveSubmission({
        studentName: name.trim(),
        className: className.trim(),
        sentence: sentence.trim(),
        correct: true,
        score: ai ? ai.score : check.grade.score,
        attrs,
        issues: [],
      });
      setSaveState('done');
      setSaveMsg('已交給老師 ✓ 你的作品會出現喺全班競猜！');
      try { setHistory(await listMySubmissions(name, className)); } catch { /* non-fatal */ }
    } catch (e) {
      setSaveState('error'); setSaveMsg(storageMessage(e));
    }
  }

  const problems = check ? check.issues : [];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {!isConfigured && (
        <div style={{ ...card, background: T.warnBg, border: `1px solid ${T.warn}`, color: T.ink2, fontSize: 13 }}>
          ⚠️ 未連接 Supabase——檢查同出圖照用，但「交畀老師」同全班競猜要喺 <code>.env</code> 填入 Supabase 金鑰先得（見 README）。
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={label}>你的名字 · Your name</div>
            <input style={input} value={name} placeholder="e.g. Amy" onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div style={label}>班別 · Class (optional)</div>
            <input style={input} value={className} placeholder="e.g. 3B" onChange={(e) => setClassName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* write — students type their OWN sentence; framework shown as guidance only */}
      <div style={card}>
        <div style={label}>Step 1 · 自己寫一句句子</div>
        <div style={{
          fontSize: 15, fontWeight: 800, color: T.primary, background: T.primarySoft,
          borderRadius: T.radiusSm, padding: '10px 14px', marginBottom: 10,
        }}>
          I am the <u>boy / girl</u> &nbsp;<span style={{ color: T.inA.fg }}>in</span> (clothing) &nbsp;<span style={{ color: T.withA.fg }}>with</span> (appearance).
        </div>
        <textarea
          style={{ ...input, minHeight: 64, resize: 'vertical' }}
          value={sentence}
          onChange={(e) => { setSentence(e.target.value); reset(); }}
          placeholder="自己打句子… e.g. I am the girl in a dress with long hair and glasses."
        />
        {/* vocabulary reference (NOT clickable — students must write it themselves) */}
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 12, color: T.ink2 }}>
            <b style={{ color: T.inA.fg }}>in</b> (衣物 clothing)：{CLOTHING_IN.join(', ')}
          </div>
          <div style={{ fontSize: 12, color: T.ink2 }}>
            <b style={{ color: T.withA.fg }}>with</b> (外貌/配件 appearance)：{FEATURES_WITH.join(', ')}
          </div>
        </div>
        <button style={{ ...btn('solid'), marginTop: 12 }} onClick={review} disabled={checking || !sentence.trim()}>
          {checking ? '檢查中…' : (aiEnabled ? '🤖 AI 檢查句子' : '檢查句子')} →
        </button>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
          {aiEnabled ? 'AI 會先檢查文法、拼寫、性別一致、用語是否合適，冇問題先生成人物。' : '系統會先檢查句式、介詞、拼寫、性別一致，冇問題先生成人物。'}
        </div>
      </div>

      {/* Step 2 · check result */}
      {check && (
        <div style={card}>
          <div style={label}>Step 2 · 檢查結果</div>
          {check.blocked ? (
            <div style={{ borderRadius: T.radiusSm, padding: 14, fontSize: 14, background: T.badBg, border: `1px solid ${T.bad}` }}>
              🚫 句子包含不適當／不友善字眼，<b>唔會生成圖片</b>。請改用有禮貌嘅用語再檢查。
            </div>
          ) : unlocked ? (
            <div style={{ borderRadius: T.radiusSm, padding: 14, fontSize: 14, background: T.okBg, border: `1px solid ${T.ok}` }}>
              ✅ <b>通過！</b> {ai ? ai.feedback : '句式、介詞、拼寫同性別都正確。'} 人物已生成（見下）。
            </div>
          ) : (
            <div style={{ borderRadius: T.radiusSm, padding: 14, fontSize: 14, background: T.badBg, border: `1px solid ${T.bad}`, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>✏️ 有啲地方要改好先至出圖：</div>
              {problems.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
                  <span>•</span><span dangerouslySetInnerHTML={{ __html: p.message }} />
                </div>
              ))}
              {ai && !ai.correct && ai.correction && (
                <div style={{ marginTop: 8, fontSize: 13, color: T.ink2 }}>
                  建議寫法 · Suggested: <b style={{ color: T.ink }}>{ai.correction}</b>
                </div>
              )}
              {aiErr && <div style={{ marginTop: 6, fontSize: 12, color: T.warn }}>（AI 服務未能連接，已改用規則檢查：{aiErr}）</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span>💡</span><span><b>口訣：</b>著喺身上嘅衣物 → <b>in</b>；身體特徵同配件 → <b>with</b>。</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 · avatar (only after pass) */}
      {unlocked && attrs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 16 }} className="pg-cols">
          <div style={card}>
            <div style={label}>你的句子拆解</div>
            <div style={{ fontSize: 16, marginBottom: 10 }}>{sentence.trim()}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {attrChips(attrs).map((c, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                  background: c.prep === 'in' ? T.inA.bg : T.withA.bg,
                  color: c.prep === 'in' ? T.inA.fg : T.withA.fg,
                }}>{c.prep} {c.label}</span>
              ))}
            </div>
          </div>
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={label}>Step 3 · 生成的人物</div>
            <Avatar attrs={attrs} size={200} />
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>分層素材即場拼砌 · 零 AI 延遲</div>
          </div>
        </div>
      )}

      {/* Step 4 · submit */}
      {unlocked && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button style={btn('solid')} onClick={submit} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? '提交中…' : '交畀老師 · Submit to teacher'}
          </button>
          {saveState === 'done' && <span style={{ color: T.ok, fontWeight: 700 }}>{saveMsg}</span>}
          {saveState === 'error' && <span style={{ color: T.bad, fontWeight: 700 }}>{saveMsg}</span>}
        </div>
      )}

      {/* my work history */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...label, margin: 0 }}>📒 我的作品紀錄 · My work</div>
          <button style={btn('ghost')} onClick={() => (showHistory ? setShowHistory(false) : loadHistory())}>
            {showHistory ? '收埋' : '睇我交過嘅句子'}
          </button>
          {showHistory && histState !== 'loading' && (
            <button style={{ ...btn('ghost'), borderColor: T.line, color: T.ink2 }} onClick={loadHistory}>↻ 更新</button>
          )}
        </div>
        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {histErr && <div style={{ color: T.bad, fontSize: 13, marginBottom: 8 }}>{histErr}</div>}
            {histState === 'loading' ? (
              <div style={{ color: T.ink2 }}>載入中…</div>
            ) : history.length === 0 && !histErr ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: 20 }}>仲未有紀錄。交咗第一句之後就會喺度顯示。</div>
            ) : (
              <>
                {history.length > 0 && (
                  <div style={{ fontSize: 13, color: T.ink2, marginBottom: 10 }}>
                    共 {history.length} 句 · 平均 {Math.round(history.reduce((a, s) => a + s.score, 0) / history.length)} 分
                  </div>
                )}
                <div style={{ display: 'grid', gap: 8 }}>
                  {history.map((s) => (
                    <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', border: `1px solid ${T.line}`, borderRadius: T.radiusSm }}>
                      <div style={{ flexShrink: 0 }}><Avatar attrs={s.attrs} size={48} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: T.ink }}>{s.sentence}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.score} 分 · {new Date(s.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMode;
