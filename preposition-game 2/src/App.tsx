import React, { useState } from 'react';
import { StudentMode } from './components/StudentMode';
import { ClassMode } from './components/ClassMode';
import { TeacherMode } from './components/TeacherMode';
import { getPref, savePref } from './lib/supabase';
import { T } from './lib/theme';

type View = 'student' | 'class' | 'teacher';

const TABS: { key: View; label: string; emoji: string }[] = [
  { key: 'student', label: 'Student', emoji: '✏️' },
  { key: 'class', label: 'Class Game', emoji: '👥' },
  { key: 'teacher', label: 'Teacher', emoji: '🧑\u200d🏫' },
];

export const App: React.FC = () => {
  const [view, setView] = useState<View>('student');
  const [teacherName] = useState(() => getPref('teacherName') || 'teacher');

  function editTeacherName() {
    const n = window.prompt('Teacher name (used for question-bank records):', teacherName);
    if (n && n.trim()) { savePref('teacherName', n.trim()); location.reload(); }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.ink }}>
      <header style={{ background: `linear-gradient(135deg, ${T.primary}, #a855f7)`, color: '#fff', padding: '20px 20px 54px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>🎮 Preposition Game</div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2 }}>
            Describe a person with <b>in</b> / <b>with</b> → instant check → zero-latency avatar → whole-class guessing
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '-34px auto 0', padding: '0 16px 40px' }}>
        <div style={{ display: 'flex', gap: 6, background: T.card, padding: 6, borderRadius: 14, boxShadow: '0 4px 14px rgba(0,0,0,.08)', marginBottom: 18, width: 'fit-content' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setView(t.key)}
              style={{
                border: 'none', background: view === t.key ? T.primarySoft : 'transparent',
                color: view === t.key ? T.primary : T.ink2, fontWeight: 800, fontSize: 14,
                padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: T.sans,
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {view === 'student' && <StudentMode />}
        {view === 'class' && <ClassMode />}
        {view === 'teacher' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 12, color: T.ink2 }}>
              Teacher: <b>{teacherName}</b>{' '}
              <button onClick={editTeacherName} style={{ border: 'none', background: 'transparent', color: T.primary, cursor: 'pointer', fontWeight: 700 }}>(change)</button>
            </div>
            <TeacherMode teacherName={teacherName} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
