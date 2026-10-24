import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from './Avatar';
import { AvatarAttrs, Submission } from '../lib/types';
import { SAMPLE_SENTENCES, makeDistractor, withPalette } from '../lib/game';
import { parse } from '../lib/parser';
import { listSubmissions, storageMessage, isConfigured } from '../lib/supabase';
import { T, card, btn } from '../lib/theme';

// Whole-class guessing game.
// Precondition: student-created images have been collected (submissions).
// Each round: show one student's sentence + A/B images (their correct avatar
// vs a one-attribute distractor) in random order → class guesses which is
// correct → reveal answer → reveal the CREATOR's name → teacher invites them
// to present.

interface Round {
  sentence: string;
  creator: string | null; // student name (null when using built-in samples)
  className: string;
  left: AvatarAttrs;
  right: AvatarAttrs;
  correctSide: 0 | 1;
}

function buildRound(sentence: string, attrs: AvatarAttrs, creator: string | null, className: string): Round {
  const base = withPalette({ ...attrs });
  const { attrs: distractRaw } = makeDistractor(base);
  const distract = { ...distractRaw, skin: base.skin, hairColor: base.hairColor, pattern: base.pattern, scene: base.scene };
  const correctSide: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
  return {
    sentence,
    creator,
    className,
    left: correctSide === 0 ? base : distract,
    right: correctSide === 0 ? distract : base,
    correctSide,
  };
}

export const ClassMode: React.FC = () => {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [usingSubs, setUsingSubs] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);   // shuffled indices into the pool
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadMsg, setLoadMsg] = useState('');

  // Build the pool: real submissions first, else built-in samples.
  const startFromSubmissions = useCallback((list: Submission[]) => {
    const order = list.map((_, i) => i).sort(() => Math.random() - 0.5);
    setSubs(list); setUsingSubs(true); setQueue(order);
    const first = list[order[0]];
    setRound(buildRound(first.sentence, first.attrs, first.studentName, first.className || ''));
    setPicked(null);
  }, []);

  const startFromSamples = useCallback(() => {
    setUsingSubs(false);
    const s = SAMPLE_SENTENCES[Math.floor(Math.random() * SAMPLE_SENTENCES.length)];
    setRound(buildRound(s, parse(s), null, ''));
    setPicked(null);
  }, []);

  useEffect(() => {
    if (!isConfigured) { startFromSamples(); setLoading(false); return; }
    listSubmissions()
      .then((list) => {
        if (list.length > 0) startFromSubmissions(list);
        else startFromSamples();
        setLoading(false);
      })
      .catch((e) => { setLoadMsg(storageMessage(e)); startFromSamples(); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function next() {
    setPicked(null);
    if (usingSubs && subs.length > 0) {
      let q = queue.slice(1);
      if (q.length === 0) q = subs.map((_, i) => i).sort(() => Math.random() - 0.5); // reshuffle
      setQueue(q);
      const s = subs[q[0]];
      setRound(buildRound(s.sentence, s.attrs, s.studentName, s.className || ''));
    } else {
      startFromSamples();
    }
  }

  function reload() {
    setLoading(true); setLoadMsg('');
    listSubmissions()
      .then((list) => { if (list.length > 0) startFromSubmissions(list); else startFromSamples(); setLoading(false); })
      .catch((e) => { setLoadMsg(storageMessage(e)); setLoading(false); });
  }

  function pick(side: number) {
    if (picked !== null || !round) return;
    setPicked(side);
    setScore((s) => ({ right: s.right + (side === round.correctSide ? 1 : 0), total: s.total + 1 }));
  }

  if (loading) return <div style={card}>載入學生作品中…</div>;
  if (!round) return <div style={card}>未有題目。</div>;
  const revealed = picked !== null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...card, background: T.warnBg, border: `1px solid ${T.warn}` }}>
        <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.7 }}>
          <div><b>1.</b> 老師朗讀（或投影）下面句子，全班<b>看 A/B 兩圖</b>。</div>
          <div><b>2.</b> 全班<b>猜</b>邊一張圖啱對應句子。</div>
          <div><b>3.</b> 點一下圖片<b>揭曉答案</b>，再彈出<b>創作者名</b>——老師請佢出嚟 present！</div>
          <div style={{ marginTop: 4 }}>
            題目來源：<b>{usingSubs ? `學生作品（${subs.length} 份）` : '內建範例（未有學生提交）'}</b>
            {!isConfigured && <span>（未連 Supabase，用範例）</span>}
            {loadMsg && <span style={{ color: T.bad }}> · {loadMsg}</span>}
            {isConfigured && <button style={{ ...btn('ghost'), marginLeft: 8, padding: '4px 10px', fontSize: 12 }} onClick={reload}>↻ 重新收集作品</button>}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{
          fontSize: 20, fontWeight: 800, textAlign: 'center', padding: 16,
          background: T.primarySoft, color: T.ink, borderRadius: T.radiusSm,
          border: `2px dashed ${T.primary}`,
        }}>
          “{round.sentence}”
        </div>
        <p style={{ textAlign: 'center', color: T.muted, fontSize: 13, margin: '10px 0' }}>👆 邊張圖啱？A 定 B？</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[round.left, round.right].map((a, i) => {
            const isCorrect = i === round.correctSide;
            let border = '3px solid transparent';
            let opacity = 1;
            if (revealed) {
              if (isCorrect) border = `3px solid ${T.ok}`;
              else { border = `3px solid ${T.bad}`; opacity = 0.55; }
            }
            return (
              <div key={i} onClick={() => pick(i)}
                style={{ position: 'relative', cursor: revealed ? 'default' : 'pointer', border, borderRadius: T.radius, transition: 'all .15s', opacity, background: T.card }}>
                <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 15, fontWeight: 800, padding: '3px 12px', borderRadius: 100, zIndex: 2 }}>
                  {i === 0 ? 'A' : 'B'}
                </span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Avatar attrs={a} size={200} />
                </div>
              </div>
            );
          })}
        </div>

        {revealed && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {picked === round.correctSide
                ? <span style={{ color: T.ok }}>✅ 答啱！正確答案係 {round.correctSide === 0 ? 'A' : 'B'}（綠框）</span>
                : <span style={{ color: T.bad }}>❌ 唔啱。正確答案係 {round.correctSide === 0 ? 'A' : 'B'}（綠框）</span>}
            </div>
            {round.creator ? (
              <div style={{
                marginTop: 12, padding: 16, borderRadius: T.radius,
                background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, color: '#fff',
              }}>
                <div style={{ fontSize: 14, opacity: 0.9 }}>🎨 呢份作品嘅創作者係</div>
                <div style={{ fontSize: 26, fontWeight: 900, margin: '2px 0' }}>
                  {round.creator}{round.className ? ` (${round.className})` : ''}
                </div>
                <div style={{ fontSize: 14, opacity: 0.95 }}>👏 老師邀請 {round.creator} 出嚟 present 佢嘅句子！</div>
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 13, color: T.muted }}>
                （內建範例題——有學生提交後，呢度會顯示創作者名並邀請 present。）
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          <button style={btn('solid')} onClick={next} disabled={!revealed}>下一位 ↻</button>
          <span style={{ color: T.ink2, fontWeight: 700 }}>
            得分 Score：{score.right} / {score.total}
            {score.total > 0 && ` (${Math.round((score.right / score.total) * 100)}%)`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClassMode;
