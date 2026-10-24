import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { downloadBlob } from '../lib/download';
import { Submission } from '../lib/types';
import { perStudent, errorBreakdown } from '../lib/report';
import { T, btn } from '../lib/theme';

export const TeacherReport: React.FC<{ subs: Submission[]; className: string }> = ({ subs, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const students = perStudent(subs);
  const errors = errorBreakdown(subs);
  const maxErr = errors.length ? errors[0].count : 1;

  async function exportPdf() {
    if (!ref.current) return;
    setBusy(true); setErr('');
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const ph = pdf.internal.pageSize.getHeight();
      const w = pdf.internal.pageSize.getWidth() - 48;
      const h = (canvas.height * w) / canvas.width;
      if (h <= ph - 48) {
        pdf.addImage(img, 'PNG', 24, 24, w, h);
      } else {
        let sY = 0;
        const pageH = ph - 48;
        const ratio = canvas.width / w;
        let remaining = h;
        while (remaining > 0) {
          const sliceH = Math.min(pageH, remaining);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH * ratio;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, sY * ratio, canvas.width, sliceH * ratio, 0, 0, canvas.width, sliceH * ratio);
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 24, 24, w, sliceH);
          remaining -= sliceH;
          sY += sliceH;
          if (remaining > 0) pdf.addPage();
        }
      }
      downloadBlob(`preposition-report-${Date.now()}.pdf`, pdf.output('blob'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  const th: React.CSSProperties = { padding: '6px 8px', borderBottom: `2px solid ${T.line}`, textAlign: 'left' };
  const thc: React.CSSProperties = { ...th, textAlign: 'center' };
  const td: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${T.line}` };
  const tdc: React.CSSProperties = { ...td, textAlign: 'center' };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button style={btn('solid')} onClick={exportPdf} disabled={busy || subs.length === 0}>
          {busy ? 'Building…' : '⬇ Export PDF report'}
        </button>
        {err && <span style={{ color: T.bad, fontSize: 13 }}>{err}</span>}
      </div>

      {/* printable region */}
      <div ref={ref} style={{ background: '#fff', padding: 24, borderRadius: T.radius, border: `1px solid ${T.line}` }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: T.ink }}>Preposition Game · Class Report</div>
        <div style={{ fontSize: 13, color: T.ink2, marginBottom: 4 }}>
          Class: {className === 'all' ? 'All' : className} · Generated: {new Date().toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: T.ink2, marginBottom: 16 }}>
          {students.length} student{students.length === 1 ? '' : 's'} · {subs.length} sentence{subs.length === 1 ? '' : 's'} · average accuracy{' '}
          {subs.length ? Math.round((subs.filter((s) => s.correct).length / subs.length) * 100) : 0}%
        </div>

        {/* error breakdown */}
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, margin: '8px 0' }}>Common errors</div>
        {errors.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>No error records 👍</div>
        ) : (
          <div style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
            {errors.map((e) => (
              <div key={e.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 190, fontSize: 12, color: T.ink2, flexShrink: 0 }}>{e.label}</div>
                <div style={{ flex: 1, background: '#f0eef5', borderRadius: 6, height: 18, position: 'relative' }}>
                  <div style={{ width: `${(e.count / maxErr) * 100}%`, background: T.primary, height: '100%', borderRadius: 6 }} />
                </div>
                <div style={{ width: 28, textAlign: 'right', fontWeight: 800, fontSize: 13 }}>{e.count}</div>
              </div>
            ))}
          </div>
        )}

        {/* per-student */}
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, margin: '8px 0' }}>Individual results</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: T.ink2 }}>
              <th style={th}>Student</th>
              <th style={th}>Class</th>
              <th style={thc}>Sentences</th>
              <th style={thc}>Correct</th>
              <th style={thc}>Accuracy</th>
              <th style={thc}>Avg</th>
              <th style={thc}>Best</th>
            </tr>
          </thead>
          <tbody>
            {students.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontWeight: 700 }}>{r.name}</td>
                <td style={td}>{r.className}</td>
                <td style={tdc}>{r.attempts}</td>
                <td style={tdc}>{r.correct}</td>
                <td style={{ ...tdc, color: r.accuracy >= 60 ? T.ok : T.bad, fontWeight: 800 }}>{r.accuracy}%</td>
                <td style={tdc}>{r.avgScore}</td>
                <td style={tdc}>{r.bestScore}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: T.muted }}>No student work yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherReport;
