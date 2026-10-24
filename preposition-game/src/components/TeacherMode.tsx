import React, { useState, useEffect, useMemo } from 'react';
import { downloadBlob } from '../lib/download';
import { Avatar } from './Avatar';
import { Submission, Question } from '../lib/types';
import {
  listSubmissions, deleteSubmission, listQuestions, saveQuestion, deleteQuestion,
  storageMessage, isConfigured,
} from '../lib/supabase';
import { parse } from '../lib/parser';
import { TeacherReport } from './TeacherReport';
import { T, card, btn, label, input } from '../lib/theme';

type Tab = 'subs' | 'bank' | 'report';

export const TeacherMode: React.FC<{ teacherName: string }> = ({ teacherName }) => {
  const [tab, setTab] = useState<Tab>('subs');
  const [subs, setSubs] = useState<Submission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [newQ, setNewQ] = useState('I am the boy in a t-shirt with short hair and glasses.');

  async function refresh() {
    setLoading(true); setErr('');
    try {
      const [s, q] = await Promise.all([listSubmissions(), listQuestions()]);
      setSubs(s); setQuestions(q);
    } catch (e) { setErr(storageMessage(e)); }
    setLoading(false);
  }
  useEffect(() => {
    if (!isConfigured) { setLoading(false); setErr('未連接 Supabase——請喺 .env 填入金鑰先睇到全班作品（見 README）。'); return; }
    refresh();
  }, []);

  const classes = useMemo(() => {
    const set = new Set(subs.map((s) => s.className || 'default'));
    return ['all', ...Array.from(set)];
  }, [subs]);

  const filtered = useMemo(
    () => classFilter === 'all' ? subs : subs.filter((s) => (s.className || 'default') === classFilter),
    [subs, classFilter]
  );

  const stats = useMemo(() => {
    const total = filtered.length;
    const correct = filtered.filter((s) => s.correct).length;
    const avg = total ? Math.round(filtered.reduce((a, s) => a + s.score, 0) / total) : 0;
    const students = new Set(filtered.map((s) => s.studentName)).size;
    return { total, correct, avg, students, acc: total ? Math.round((correct / total) * 100) : 0 };
  }, [filtered]);

  async function removeSub(id: string) {
    try { await deleteSubmission(id); setSubs((p) => p.filter((s) => s.id !== id)); }
    catch (e) { setErr(storageMessage(e)); }
  }
  async function addQuestion() {
    if (!newQ.trim()) return;
    try {
      const q = await saveQuestion(newQ.trim(), parse(newQ.trim()), teacherName || 'teacher');
      setQuestions((p) => [q, ...p]);
    } catch (e) { setErr(storageMessage(e)); }
  }
  async function removeQuestion(id: string) {
    try { await deleteQuestion(id); setQuestions((p) => p.filter((q) => q.id !== id)); }
    catch (e) { setErr(storageMessage(e)); }
  }

  function exportCsv() {
    const header = ['Name', 'Class', 'Sentence', 'Correct', 'Score', 'Issues', 'Time'];
    const rows = filtered.map((s) => [
      s.studentName, s.className || '', s.sentence, s.correct ? 'Y' : 'N',
      String(s.score), s.issues.join('; '), new Date(s.timestamp).toLocaleString(),
    ]);
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    downloadBlob(`preposition-submissions-${Date.now()}.csv`, new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  }

  const stat = (v: string | number, l: string, color = T.ink) => (
    <div style={{ ...card, textAlign: 'center', padding: 14 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      <div style={{ fontSize: 11, color: T.ink2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{l}</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6, background: '#efeaf6', padding: 5, borderRadius: 12, width: 'fit-content' }}>
        {([['subs', '📥 學生作品'], ['bank', '📚 題庫'], ['report', '📊 成績報表']] as [Tab, string][]).map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ border: 'none', background: tab === k ? T.card : 'transparent', color: tab === k ? T.primary : T.ink2, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: T.sans, fontSize: 14 }}>
            {lbl}
          </button>
        ))}
      </div>

      {err && <div style={{ ...card, background: T.badBg, border: `1px solid ${T.bad}`, color: T.bad }}>{err}</div>}

      {tab === 'subs' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }} className="pg-stats">
            {stat(stats.students, '學生', T.primary)}
            {stat(stats.total, '造句數')}
            {stat(stats.correct, '正確', T.ok)}
            {stat(`${stats.acc}%`, '正確率', T.ok)}
            {stat(stats.avg, '平均分', T.warn)}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ ...label, margin: 0 }}>班別</span>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              style={{ ...input, width: 'auto', padding: '8px 12px' }}>
              {classes.map((c) => <option key={c} value={c}>{c === 'all' ? '全部' : c}</option>)}
            </select>
            <button style={btn('ghost')} onClick={refresh}>↻ 重新整理</button>
            <button style={btn('solid')} onClick={exportCsv} disabled={!filtered.length}>⬇ 匯出 CSV</button>
          </div>

          <div style={card}>
            {loading ? <div style={{ color: T.ink2 }}>載入中…</div> :
              filtered.length === 0 ? <div style={{ color: T.muted, textAlign: 'center', padding: 24 }}>仲未有學生作品。學生喺「學生」分頁交咗之後就會喺度顯示。</div> :
                <div style={{ display: 'grid', gap: 8 }}>
                  {filtered.map((s) => (
                    <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', border: `1px solid ${T.line}`, borderRadius: T.radiusSm }}>
                      <div style={{ flexShrink: 0 }}><Avatar attrs={s.attrs} size={54} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <b>{s.studentName}</b>
                          {s.className && <span style={{ fontSize: 11, background: T.bg, padding: '2px 8px', borderRadius: 100, color: T.ink2 }}>{s.className}</span>}
                          <span style={{ fontSize: 11, fontWeight: 800, color: s.correct ? T.ok : T.bad }}>{s.correct ? '✓ 正確' : '✗ 有錯'} · {s.score}分</span>
                        </div>
                        <div style={{ fontSize: 14, color: T.ink, marginTop: 2 }}>{s.sentence}</div>
                        {s.issues.length > 0 && <div style={{ fontSize: 11, color: T.bad, marginTop: 2 }}>{s.issues.join(' · ')}</div>}
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{new Date(s.timestamp).toLocaleString()}</div>
                      </div>
                      <button onClick={() => removeSub(s.id)} title="刪除"
                        style={{ border: 'none', background: 'transparent', color: T.muted, cursor: 'pointer', fontSize: 18 }}>🗑</button>
                    </div>
                  ))}
                </div>}
          </div>
        </>
      )}

      {tab === 'bank' && (
        <>
          <div style={card}>
            <div style={label}>加入題目（全班競猜會用到）</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input style={{ ...input, flex: 1, minWidth: 240 }} value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder="I am the girl in a dress with long hair and a necklace." />
              <button style={btn('solid')} onClick={addQuestion}>＋ 加入</button>
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
              加入後，「全班競猜」分頁會自動改用你的題庫（而非內建範例）。
            </div>
          </div>
          <div style={card}>
            <div style={label}>題庫（{questions.length}）</div>
            {questions.length === 0 ? <div style={{ color: T.muted, textAlign: 'center', padding: 20 }}>題庫係空嘅 — 全班競猜會用內建範例。</div> :
              <div style={{ display: 'grid', gap: 8 }}>
                {questions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', border: `1px solid ${T.line}`, borderRadius: T.radiusSm }}>
                    <div style={{ flexShrink: 0 }}><Avatar attrs={q.attrs} size={48} /></div>
                    <div style={{ flex: 1, fontSize: 14 }}>{q.prompt}</div>
                    <button onClick={() => removeQuestion(q.id)} title="刪除"
                      style={{ border: 'none', background: 'transparent', color: T.muted, cursor: 'pointer', fontSize: 18 }}>🗑</button>
                  </div>
                ))}
              </div>}
          </div>
        </>
      )}

      {tab === 'report' && <TeacherReport subs={filtered} className={classFilter} />}
    </div>
  );
};

export default TeacherMode;
