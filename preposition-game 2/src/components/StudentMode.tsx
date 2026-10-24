import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { attrChips } from '../lib/parser';
import { precheck, PreCheckResult, QMode } from '../lib/check';
import { withPalette } from '../lib/game';
import { aiGrade, aiEnabled } from '../lib/ai';
import { Submission, AiGrade, AvatarAttrs } from '../lib/types';
import {
  saveSubmission, savePref, getPref, listMySubmissions, storageMessage, isConfigured,
} from '../lib/supabase';
import { CLOTHING_IN, FEATURES_WITH } from '../lib/vocab';
import { T, card, btn, label, input } from '../lib/theme';

// Students MUST write their own sentence (no picking from a list).
// A question-type level (in / with / both) accommodates different abilities.
// The avatar is generated ONLY after the sentence passes the pre-check gate.
// When an AI endpoint is configured the AI is the authoritative reader; the
// rule precheck always runs first so foul language is hard-blocked instantly.

const MODES: { key: QMode; label: string; hint: string; frame: React.ReactNode }[] = [
  {
    key: 'in', label: 'Starter A · in only', hint: 'Describe clothing only',
    frame: <>I am the <u>boy / girl</u> <span style={{ color: '#0369a1' }}>in</span> (clothing).</>,
  },
  {
    key: 'with', label: 'Starter B · with only', hint: 'Describe appearance only',
    frame: <>I am the <u>boy / girl</u> <span style={{ color: '#be185d' }}>with</span> (appearance).</>,
  },
  {
    key: 'both', label: 'Advanced · in + with', hint: 'Clothing and appearance',
    frame: <>I am the <u>boy / girl</u> <span style={{ color: '#0369a1' }}>in</span> (clothing) <span style={{ color: '#be185d' }}>with</span> (appearance).</>,
  },
];

export const StudentMode: React.FC = () => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [mode, setMode] = useState<QMode>('both');
  const [sentence, setSentence] = useState('');
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<PreCheckResult | null>(null);
  const [ai, setAi] = useState<AiGrade | null>(null);
  const [aiErr, setAiErr] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [shownAttrs, setShownAttrs] = useState<AvatarAttrs | null>(null);
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
  const activeMode = MODES.find((m) => m.key === mode)!;

  function reset() {
    setCheck(null); setAi(null); setAiErr(''); setUnlocked(false); setSaveState('idle'); setShownAttrs(null);
  }

  async function review() {
    if (!sentence.trim()) return;
    reset();
    setChecking(true);
    const pc = precheck(sentence, mode);
    setCheck(pc);
    setShownAttrs(withPalette(pc.attrs));
    if (pc.blocked) { setUnlocked(false); setChecking(false); return; }
    if (aiEnabled) {
      try {
        const g = await aiGrade(sentence, mode);
        setAi(g);
        setUnlocked(pc.ok && g.correct);
      } catch (e) {
        setAiErr(e instanceof Error ? e.message : String(e));
        setUnlocked(pc.ok);
      }
    } else {
      setUnlocked(pc.ok);
    }
    setChecking(false);
  }

  async function loadHistory() {
    if (!name.trim()) { setHistErr('Please enter your name first to see your work.'); setShowHistory(true); return; }
    setHistState('loading'); setHistErr(''); setShowHistory(true);
    try { setHistory(await listMySubmissions(name, className)); setHistState('idle'); }
    catch (e) { setHistState('error'); setHistErr(storageMessage(e)); }
  }

  async function submit() {
    if (!check || !attrs || !unlocked) return;
    if (!name.trim()) { setSaveState('error'); setSaveMsg('Please enter your name first.'); return; }
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
        attrs: shownAttrs ?? attrs,
        issues: [],
      });
      setSaveState('done');
      setSaveMsg('Submitted to your teacher ✓ Your work will appear in the Class Game!');
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
          ⚠️ Supabase is not connected — checking and avatars still work, but "Submit to teacher" and the Class Game need the <code>VITE_SUPABASE_*</code> keys in <code>.env</code> (see README).
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={label}>Your name</div>
            <input style={input} value={name} placeholder="e.g. Amy" onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div style={label}>Class (optional)</div>
            <input style={input} value={className} placeholder="e.g. 3B" onChange={(e) => setClassName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* level selector */}
      <div style={card}>
        <div style={label}>Step 1 · Choose a level</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MODES.map((m) => (
            <button key={m.key} onClick={() => { setMode(m.key); reset(); }}
              style={{
                flex: '1 1 180px', textAlign: 'left', cursor: 'pointer', fontFamily: T.sans,
                border: `2px solid ${mode === m.key ? T.primary : T.line}`,
                background: mode === m.key ? T.primarySoft : T.card,
                borderRadius: T.radiusSm, padding: '10px 12px',
              }}>
              <div style={{ fontWeight: 800, color: mode === m.key ? T.primary : T.ink, fontSize: 14 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: T.ink2, marginTop: 2 }}>{m.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* write — students type their OWN sentence; framework shown as guidance only */}
      <div style={card}>
        <div style={label}>Step 2 · Write your own sentence</div>
        <div style={{
          fontSize: 15, fontWeight: 800, color: T.primary, background: T.primarySoft,
          borderRadius: T.radiusSm, padding: '10px 14px', marginBottom: 10,
        }}>
          {activeMode.frame}
        </div>
        <textarea
          style={{ ...input, minHeight: 64, resize: 'vertical' }}
          value={sentence}
          onChange={(e) => { setSentence(e.target.value); reset(); }}
          placeholder="Type your own sentence… e.g. I am the girl in a dress."
        />
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 12, color: T.ink2 }}>
            <b style={{ color: T.inA.fg }}>in</b> (clothing): {CLOTHING_IN.join(', ')}
          </div>
          <div style={{ fontSize: 12, color: T.ink2 }}>
            <b style={{ color: T.withA.fg }}>with</b> (appearance): {FEATURES_WITH.join(', ')}
          </div>
        </div>
        <button style={{ ...btn('solid'), marginTop: 12 }} onClick={review} disabled={checking || !sentence.trim()}>
          {checking ? 'Checking…' : (aiEnabled ? '🤖 Check my sentence' : 'Check my sentence')} →
        </button>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
          {aiEnabled
            ? 'The AI checks grammar, spelling, prepositions, pronouns and kind language first — your avatar appears only when it passes.'
            : 'The checker reviews sentence frame, prepositions, spelling and pronouns first — your avatar appears only when it passes.'}
        </div>
      </div>

      {/* Step 3 · check result */}
      {check && (
        <div style={card}>
          <div style={label}>Step 3 · Check result</div>
          {check.blocked ? (
            <div style={{ borderRadius: T.radiusSm, padding: 14, fontSize: 14, background: T.badBg, border: `1px solid ${T.bad}` }}>
              🚫 Your sentence has words that are not appropriate, so <b>no picture will be made</b>. Please use kind words and check again.
            </div>
          ) : unlocked ? (
            <div style={{ borderRadius: T.radiusSm, padding: 14, fontSize: 14, background: T.okBg, border: `1px solid ${T.ok}` }}>
              ✅ <b>Passed!</b> {ai ? ai.feedback : 'Your sentence, prepositions, spelling and pronouns are correct.'} Your avatar is ready below.
            </div>
          ) : (
            <div style={{ borderRadius: T.radiusSm, padding: 14, fontSize: 14, background: T.badBg, border: `1px solid ${T.bad}`, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>✏️ Fix these before the picture is made:</div>
              {ai && !ai.correct && ai.feedback && (
                <div style={{ display: 'flex', gap: 8, margin: '3px 0' }}><span>🤖</span><span>{ai.feedback}</span></div>
              )}
              {problems.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
                  <span>•</span><span dangerouslySetInnerHTML={{ __html: p.message }} />
                </div>
              ))}
              {ai && !ai.correct && ai.correction && (
                <div style={{ marginTop: 8, fontSize: 13, color: T.ink2 }}>
                  Suggested: <b style={{ color: T.ink }}>{ai.correction}</b>
                </div>
              )}
              {aiErr && <div style={{ marginTop: 6, fontSize: 12, color: T.warn }}>(AI service unavailable, using the built-in checker: {aiErr})</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span>💡</span><span><b>Tip:</b> clothing you wear → <b>in</b>; body features and accessories → <b>with</b>.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4 · avatar (only after pass) */}
      {unlocked && attrs && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 16 }} className="pg-cols">
          <div style={card}>
            <div style={label}>Your sentence, broken down</div>
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
            <div style={label}>Your avatar</div>
            <Avatar attrs={shownAttrs ?? attrs} size={200} />
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Built from layered art · zero AI delay</div>
          </div>
        </div>
      )}

      {/* Step 5 · submit */}
      {unlocked && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button style={btn('solid')} onClick={submit} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Submitting…' : 'Submit to teacher'}
          </button>
          {saveState === 'done' && <span style={{ color: T.ok, fontWeight: 700 }}>{saveMsg}</span>}
          {saveState === 'error' && <span style={{ color: T.bad, fontWeight: 700 }}>{saveMsg}</span>}
        </div>
      )}

      {/* my work history */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...label, margin: 0 }}>📒 My work</div>
          <button style={btn('ghost')} onClick={() => (showHistory ? setShowHistory(false) : loadHistory())}>
            {showHistory ? 'Hide' : 'See my sentences'}
          </button>
          {showHistory && histState !== 'loading' && (
            <button style={{ ...btn('ghost'), borderColor: T.line, color: T.ink2 }} onClick={loadHistory}>↻ Refresh</button>
          )}
        </div>
        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {histErr && <div style={{ color: T.bad, fontSize: 13, marginBottom: 8 }}>{histErr}</div>}
            {histState === 'loading' ? (
              <div style={{ color: T.ink2 }}>Loading…</div>
            ) : history.length === 0 && !histErr ? (
              <div style={{ color: T.muted, textAlign: 'center', padding: 20 }}>No work yet. Your first submission will show up here.</div>
            ) : (
              <>
                {history.length > 0 && (
                  <div style={{ fontSize: 13, color: T.ink2, marginBottom: 10 }}>
                    {history.length} sentence{history.length > 1 ? 's' : ''} · average {Math.round(history.reduce((a, s) => a + s.score, 0) / history.length)} pts
                  </div>
                )}
                <div style={{ display: 'grid', gap: 8 }}>
                  {history.map((s) => (
                    <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', border: `1px solid ${T.line}`, borderRadius: T.radiusSm }}>
                      <div style={{ flexShrink: 0 }}><Avatar attrs={s.attrs} size={48} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: T.ink }}>{s.sentence}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.score} pts · {new Date(s.timestamp).toLocaleString()}</div>
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
