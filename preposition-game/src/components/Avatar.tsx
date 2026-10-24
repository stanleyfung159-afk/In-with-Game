import React from 'react';
import { AvatarAttrs } from '../lib/types';
import { SKIN_TONES, HAIR_COLORS, TOP_COLORS, BOTTOM_COLORS } from '../lib/vocab';

// ----------------------------------------------------------------------------
// Avatar: a layered flat-vector (cartoon) character composed entirely from SVG.
// Deterministic, instant, 100% reliable — the opposite of unstable AI image gen.
// Not photorealistic and not a real person: a stylised classroom mascot.
// ----------------------------------------------------------------------------

interface Props {
  attrs: AvatarAttrs;
  size?: number;
}

export const Avatar: React.FC<Props> = ({ attrs: a, size = 240 }) => {
  const skin = SKIN_TONES[a.skin ?? 1] ?? SKIN_TONES[1];
  const hairCol = HAIR_COLORS[a.hairColor ?? 1] ?? HAIR_COLORS[1];
  const SK = skin.base;
  const SKD = skin.dark;
  const topCol = a.topColor ?? (a.top ? TOP_COLORS[a.top] : '#c7cdd6');
  const botCol = a.bottomColor ?? (a.bottom ? BOTTOM_COLORS[a.bottom] : '#9aa3ad');
  const pattern = a.pattern ?? 'none';
  const scene = a.scene ?? 'plain';
  const uid = React.useId().replace(/:/g, '');
  const topFill = pattern === 'none' ? topCol : `url(#pat-${uid})`;

  return (
    <svg viewBox="0 0 240 380" width={size} height={(size * 380) / 240} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="avatar">
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f6f1fb" />
        </linearGradient>
        {pattern === 'stripes' && (
          <pattern id={`pat-${uid}`} width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill={topCol} />
            <rect width="7" height="14" fill="#ffffff55" />
          </pattern>
        )}
        {pattern === 'dots' && (
          <pattern id={`pat-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill={topCol} />
            <circle cx="8" cy="8" r="3" fill="#ffffff80" />
          </pattern>
        )}
      </defs>

      {/* background scene */}
      {scene === 'plain' && <rect width="240" height="380" rx="16" fill={`url(#bg-${uid})`} />}
      {scene === 'classroom' && (
        <>
          <rect width="240" height="380" rx="16" fill="#eef4fb" />
          <rect x="24" y="30" width="150" height="86" rx="6" fill="#2f6b4f" />
          <rect x="24" y="30" width="150" height="86" rx="6" fill="none" stroke="#8a5a32" strokeWidth="5" />
          <path d="M34 60 h40 M34 74 h66 M34 88 h30" stroke="#ffffff90" strokeWidth="2.5" />
          <rect x="188" y="40" width="34" height="46" rx="4" fill="#cfe0f2" stroke="#9db6d2" strokeWidth="3" />
        </>
      )}
      {scene === 'park' && (
        <>
          <rect width="240" height="380" rx="16" fill="#eaf7ec" />
          <rect y="300" width="240" height="80" fill="#bfe6c3" />
          <circle cx="44" cy="54" r="24" fill="#f7d774" />
          <circle cx="196" cy="300" r="34" fill="#7bbf84" />
          <rect x="192" y="300" width="8" height="40" fill="#8a5a32" />
          <circle cx="60" cy="300" r="26" fill="#8fce98" />
          <rect x="56" y="300" width="7" height="34" fill="#8a5a32" />
        </>
      )}
      <ellipse cx="120" cy="352" rx="70" ry="12" fill="#00000010" />

      {/* long hair BACK layer */}
      {a.hair === 'long' && (
        <>
          <path d="M70 92 Q60 220 92 250 L108 250 Q80 170 90 96 Z" fill={hairCol} />
          <path d="M170 92 Q180 220 148 250 L132 250 Q160 170 150 96 Z" fill={hairCol} />
        </>
      )}

      {/* neck */}
      <rect x="107" y="126" width="26" height="34" rx="6" fill={SK} />
      <path d="M107 150 q13 10 26 0 v6 q-13 10 -26 0 Z" fill={SKD} />

      {/* legs */}
      <rect x="97" y="250" width="18" height="96" rx="8" fill={SK} />
      <rect x="125" y="250" width="18" height="96" rx="8" fill={SK} />
      <ellipse cx="102" cy="350" rx="14" ry="8" fill="#3a3a3a" />
      <ellipse cx="138" cy="350" rx="14" ry="8" fill="#3a3a3a" />

      {/* bottom clothing */}
      {a.bottom === 'shorts' && (
        <path d="M90 248 h60 v36 h-24 v-22 h-12 v22 h-24 Z" fill={botCol} />
      )}
      {(a.bottom === 'trousers' || a.bottom === 'jeans') && (
        <path d="M90 248 h60 v100 h-24 v-82 h-12 v82 h-24 Z" fill={botCol} />
      )}
      {a.bottom === 'skirt' && <path d="M88 250 L152 250 L170 304 L70 304 Z" fill={botCol} />}

      {/* torso / top */}
      {a.top === 'dress' ? (
        <>
          <path d="M90 158 Q120 148 150 158 L176 306 L64 306 Z" fill={topFill} />
          <path d="M90 160 L66 214 L82 222 L100 172 Z" fill={topCol} />
          <path d="M150 160 L174 214 L158 222 L140 172 Z" fill={topCol} />
        </>
      ) : (
        <>
          <path d="M84 158 Q120 146 156 158 L164 256 L76 256 Z" fill={topFill} />
          <path d="M84 160 L62 200 L80 210 L98 172 Z" fill={topCol} />
          <path d="M156 160 L178 200 L160 210 L142 172 Z" fill={topCol} />
          <path d="M108 156 L120 168 L132 156 Z" fill="#ffffff40" />
        </>
      )}

      {/* lower arms */}
      <rect x="62" y="198" width="16" height="56" rx="8" fill={SK} />
      <rect x="162" y="198" width="16" height="56" rx="8" fill={SK} />
      <circle cx="70" cy="256" r="9" fill={SKD} />
      <circle cx="170" cy="256" r="9" fill={SKD} />

      {/* head */}
      <ellipse cx="120" cy="90" rx="47" ry="53" fill={SK} />
      <ellipse cx="72" cy="94" rx="8" ry="11" fill={SK} />
      <ellipse cx="168" cy="94" rx="8" ry="11" fill={SK} />
      <circle cx="96" cy="104" r="7" fill="#ff9a9a40" />
      <circle cx="144" cy="104" r="7" fill="#ff9a9a40" />
      <ellipse cx="103" cy="90" rx="5.5" ry="6.5" fill="#2b2b2b" />
      <ellipse cx="137" cy="90" rx="5.5" ry="6.5" fill="#2b2b2b" />
      <circle cx="105" cy="88" r="1.8" fill="#fff" />
      <circle cx="139" cy="88" r="1.8" fill="#fff" />
      <path d="M95 79 q8 -4 16 0" stroke={hairCol} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M129 79 q8 -4 16 0" stroke={hairCol} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M120 96 l-4 11 h8 Z" fill={SKD} />
      <path d="M107 117 Q120 128 133 117" stroke="#b5654a" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* facial hair */}
      {a.moustache && (
        <path d="M103 113 Q120 122 137 113 Q120 117 103 113" fill={hairCol} stroke={hairCol} strokeWidth="4" strokeLinejoin="round" />
      )}
      {a.beard && (
        <path d="M78 98 Q82 152 120 152 Q158 152 162 98 Q150 130 120 132 Q90 130 78 98 Z" fill={hairCol} />
      )}

      {/* hair top / front */}
      {a.hair === 'curly' && (
        <>
          {Array.from({ length: 9 }).map((_, i) => (
            <circle key={i} cx={74 + i * 11.5} cy={52 + (i % 2) * 5} r={11.5} fill={hairCol} />
          ))}
          <path d="M70 56 Q120 32 170 56 L170 76 Q120 60 70 76 Z" fill={hairCol} />
        </>
      )}
      {a.hair === 'long' && (
        <path d="M70 92 Q72 40 120 38 Q168 40 170 92 Q150 62 120 62 Q90 62 70 92 Z" fill={hairCol} />
      )}
      {a.hair === 'short' && (
        <path d="M74 82 Q76 42 120 40 Q164 42 166 82 Q150 58 120 60 Q90 58 74 82 Z" fill={hairCol} />
      )}

      {/* accessories */}
      {a.glasses && (
        <g stroke="#333" strokeWidth="3" fill="none">
          <circle cx="103" cy="90" r="13" />
          <circle cx="137" cy="90" r="13" />
          <line x1="116" y1="90" x2="124" y2="90" />
          <line x1="90" y1="88" x2="80" y2="86" />
          <line x1="150" y1="88" x2="160" y2="86" />
        </g>
      )}
      {a.sunglasses && (
        <g>
          <rect x="89" y="81" width="28" height="18" rx="7" fill="#1f2937" />
          <rect x="123" y="81" width="28" height="18" rx="7" fill="#1f2937" />
          <line x1="117" y1="88" x2="123" y2="88" stroke="#1f2937" strokeWidth="4" />
          <rect x="94" y="84" width="8" height="4" rx="2" fill="#ffffff60" />
        </g>
      )}
      {a.earrings && (
        <>
          <circle cx="72" cy="112" r="4.5" fill="#f5c518" />
          <circle cx="168" cy="112" r="4.5" fill="#f5c518" />
        </>
      )}
      {a.necklace && (
        <>
          <path d="M103 152 Q120 174 137 152" stroke="#f5c518" strokeWidth="3" fill="none" />
          <circle cx="120" cy="170" r="5" fill="#f5c518" />
        </>
      )}
      {a.handbag && (
        <g>
          <rect x="150" y="226" width="40" height="30" rx="6" fill="#b4472e" />
          <path d="M157 226 Q170 206 183 226" stroke="#b4472e" strokeWidth="3.5" fill="none" />
          <rect x="166" y="238" width="8" height="6" rx="2" fill="#ffffff80" />
        </g>
      )}
    </svg>
  );
};

export default Avatar;
