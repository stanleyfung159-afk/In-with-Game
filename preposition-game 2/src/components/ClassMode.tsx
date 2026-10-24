import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from './Avatar';
import { AvatarAttrs, Submission } from '../lib/types';
import { SAMPLE_SENTENCES, makeDistractor, withPalette } from '../lib/game';
import { parse } from '../lib/parser';
import { listSubmissions, storageMessage, isConfigured } from '../lib/supabase';
import { T, card, btn } from '../lib/theme';

// Whole-class guessing game — creator-first flow.
// Precondition: student-created images have been collected (submissions).
// Each round: FIRST reveal the creator's name (they come up and read their
// sentence) -> class sees A/B images (their correct avatar vs a one-attribute
// distractor, random order) -> class guesses -> reveal correct answer.

interface Round {
  sentence: string;
  creator: string | null;
  className: string;
  left: AvatarAttrs;
  right: AvatarAttrs;
  correctSide: 0 | 1;
}

function buildRound(sentence: string, attrs: AvatarAttrs, creator: string | null, className: string): Round {
  const base = withPalette({ ...attrs });
  const { attrs: distractRaw } = makeDistractor(base, sentence);
  const distract = { ...distractRaw, skin: base.skin, hairColor: base.hairColor, topColor: base.topColor, bottomColor: base.bottomColor, accentColor: base.accentColor, pattern: base.pattern, scene: base.scene };
  const correctSide: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
  return {
    sentence, creator, className,
    left: correctSide === 0 ? base : distract,
    right: correctSide === 0 ? distract : base,
    correctSide,
  };
}

export const ClassMode: React.FC = () => {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [usingSubs, setUsingSubs] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadMsg, setLoadMsg] = useState('');

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
      .then((list) => { if (list.length > 0) startFromSubmissions(list); else startFromSamples(); setLoading(false); })
      .catch((e) => { setLoadMsg(storageMessage(e)); startFromSamples(); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function next() {
    setPicked(null);
    if (usingSubs && subs.length > 0) {
      let q = queue.slice(1);
      if (q.length === 0) q = subs.map((_, i) => i).sort(() => Math.random() - 0.5);
      setQueue(q);
      const s = subs[q[0]];
      setRound(buildRound(s.sentence, s.attrs, s.studentName, s.className || ''));
    } else {
      startFromSamples();
    }
  }

  function reload() {
    if (!isConfigured) { startFromSamples(); return; }
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

  if (loading) return <div style={card}>Loading student work…</div>;
  if (!round) return <div style={card}>No questions yet.</div>;
  const revealed = picked !== null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* compact source bar (replaces the old step-by-step box) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: T.ink2 }}>
        <span>Source: <b>{usingSubs ? `student work (${subs.length})` : 'built-in samples'}</b></span>
        {!isConfigured && <span>(Supabase not connected — using samples)</span>}
        {loadMsg && <span style={{ color: T.bad }}>· {loadMsg}</span>}
        <button style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={reload}>↻ Collect latest work</button>
      </div>

      {/* creator revealed FIRST */}
      <div style={{
        ...card, textAlign: 'center',
        background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, color: '#fff', border: 'none',
      }}>
        {round.creator ? (
          <>
            <div style={{ fontSize: 14, opacity: 0.9 }}>🎤 This work was created by</div>
            <div style={{ fontSize: 26, fontWeight: 900, margin: '2px 0' }}>
              {round.creator}{round.className ? ` (${round.className})` : ''}
            </div>
            <div style={{ fontSize: 14, opacity: 0.95 }}>Invite {round.creator} to come up and read their sentence — class, get ready to guess!</div>
          </>
        ) : (
          <div style={{ fontSize: 15, fontWeight: 700 }}>Sample question (no student submissions yet)</div>
        )}
      </div>

      <div style={card}>
        <div style={{
          fontSize: 20, fontWeight: 800, textAlign: 'center', padding: 16,
          background: T.primarySoft, color: T.ink, borderRadius: T.radiusSm, border: `2px dashed ${T.primary}`,
        }}>
          “{round.sentence}”
        </div>
        <p style={{ textAlign: 'center', color: T.muted, fontSize: 13, margin: '10px 0' }}>👆 Which picture is correct — A or B?</p>

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
          <div style={{ textAlign: 'center', marginTop: 14, fontWeight: 800, fontSize: 16 }}>
            {picked === round.correctSide
              ? <span style={{ color: T.ok }}>✅ Correct! The answer is {round.correctSide === 0 ? 'A' : 'B'} (green border)</span>
              : <span style={{ color: T.bad }}>❌ Not quite. The answer is {round.correctSide === 0 ? 'A' : 'B'} (green border)</span>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          <button style={btn('solid')} onClick={next} disabled={!revealed}>Next student ↻</button>
          <span style={{ color: T.ink2, fontWeight: 700 }}>
            Score: {score.right} / {score.total}
            {score.total > 0 && ` (${Math.round((score.right / score.total) * 100)}%)`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClassMode;
