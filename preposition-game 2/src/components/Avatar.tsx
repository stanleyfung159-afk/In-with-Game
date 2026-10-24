import React from 'react';
import { AvatarAttrs } from '../lib/types';
import { SKIN_TONES, HAIR_COLORS, TOP_COLORS, BOTTOM_COLORS } from '../lib/vocab';

// ----------------------------------------------------------------------------
// Avatar: a layered flat-vector (cartoon) character composed entirely from SVG.
// Deterministic, instant, 100% reliable — the opposite of unstable AI image gen.
// Not photorealistic and not a real person: a stylised classroom mascot.
//
// Gender cues (NOT via clothing — any child may wear anything):
//   girl = hair bow + eyelashes + arched brows + fuller lips + narrower shoulders
//   boy  = thick straight brows + sideburns + squarer jaw + broader shoulders
// Skirt vs dress are drawn as clearly different silhouettes.
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
  const accent = a.accentColor ?? '#ef4444';
  const pattern = a.pattern ?? 'none';
  const scene = a.scene ?? 'plain';
  const girl = a.gender === 'girl';
  const uid = React.useId().replace(/:/g, '');
  const topFill = pattern === 'none' ? topCol : `url(#pat-${uid})`;
  const longLike = a.hair === 'long' || a.hair === 'straight';

  return (
    <svg viewBox="0 0 240 390" width={size} height={(size * 390) / 240} xmlns="http://www.w3.org/2000/svg" role="img">
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
      {scene === 'plain' && <rect width="240" height="390" rx="16" fill={`url(#bg-${uid})`} />}
      {scene === 'classroom' && (
        <>
          <rect width="240" height="390" rx="16" fill="#eef4fb" />
          <rect x="24" y="30" width="150" height="86" rx="6" fill="#2f6b4f" />
          <rect x="24" y="30" width="150" height="86" rx="6" fill="none" stroke="#8a5a32" strokeWidth="5" />
          <path d="M34 60 h40 M34 74 h66 M34 88 h30" stroke="#ffffff90" strokeWidth="2.5" />
          <rect x="188" y="40" width="34" height="46" rx="4" fill="#cfe0f2" stroke="#9db6d2" strokeWidth="3" />
        </>
      )}
      {scene === 'park' && (
        <>
          <rect width="240" height="390" rx="16" fill="#eaf7ec" />
          <rect y="308" width="240" height="82" fill="#bfe6c3" />
          <circle cx="44" cy="54" r="24" fill="#f7d774" />
          <circle cx="196" cy="306" r="34" fill="#7bbf84" />
          <rect x="192" y="306" width="8" height="42" fill="#8a5a32" />
          <circle cx="60" cy="308" r="26" fill="#8fce98" />
          <rect x="56" y="308" width="7" height="36" fill="#8a5a32" />
        </>
      )}
      <ellipse cx="120" cy="360" rx="72" ry="12" fill="#00000010" />

      {/* long / straight hair BACK layer */}
      {longLike && (
        <>
          <path d="M70 92 Q58 232 92 262 L108 262 Q78 176 90 96 Z" fill={hairCol} />
          <path d="M170 92 Q182 232 148 262 L132 262 Q162 176 150 96 Z" fill={hairCol} />
        </>
      )}

      {/* neck */}
      <rect x="107" y="126" width="26" height="34" rx="6" fill={SK} />
      <path d="M107 150 q13 10 26 0 v6 q-13 10 -26 0 Z" fill={SKD} />

      {/* legs */}
      <rect x="97" y="250" width="18" height="104" rx="8" fill={SK} />
      <rect x="125" y="250" width="18" height="104" rx="8" fill={SK} />

      {/* socks (coloured bands above the feet) */}
      {a.socks && (
        <>
          <rect x="96" y="336" width="20" height="18" rx="4" fill={accent} />
          <rect x="124" y="336" width="20" height="18" rx="4" fill={accent} />
        </>
      )}

      {/* footwear */}
      {a.footwear === 'sandals' ? (
        <>
          <ellipse cx="102" cy="356" rx="15" ry="6" fill="#8a5a32" />
          <ellipse cx="138" cy="356" rx="15" ry="6" fill="#8a5a32" />
          <path d="M94 352 l16 -6 M110 352 l-16 -6" stroke="#8a5a32" strokeWidth="3" />
          <path d="M130 352 l16 -6 M146 352 l-16 -6" stroke="#8a5a32" strokeWidth="3" />
        </>
      ) : (
        <>
          <ellipse cx="102" cy="356" rx="14" ry="8" fill="#3a3a3a" />
          <ellipse cx="138" cy="356" rx="14" ry="8" fill="#3a3a3a" />
        </>
      )}

      {/* bottom clothing (pants) */}
      {a.bottom === 'shorts' && (
        <path d="M90 248 h60 v38 h-24 v-24 h-12 v24 h-24 Z" fill={botCol} />
      )}
      {(a.bottom === 'trousers' || a.bottom === 'jeans') && (
        <path d="M90 248 h60 v104 h-24 v-86 h-12 v86 h-24 Z" fill={botCol} />
      )}

      {/* SKIRT — short, pleated, two-piece (clearly different from a dress) */}
      {a.bottom === 'skirt' && (
        <g>
          <path d="M90 250 L150 250 L168 300 L72 300 Z" fill={botCol} />
          <path d="M106 252 L100 300 M120 252 L120 300 M134 252 L140 300" stroke="#00000022" strokeWidth="2.5" fill="none" />
          <path d="M72 300 l12 8 l12 -8 l12 8 l12 -8 l12 8 l12 -8 l12 8" fill="none" stroke={botCol} strokeWidth="6" strokeLinejoin="round" />
          <path d="M88 248 h64 v6 H88 Z" fill="#00000018" />
        </g>
      )}

      {/* torso / top */}
      {a.top === 'dress' ? (
        <g>
          <path d={girl
            ? 'M90 158 Q120 150 150 158 L148 214 Q120 208 92 214 Z'
            : 'M88 158 Q120 150 152 158 L152 214 L88 214 Z'} fill={topFill} />
          <rect x="90" y="210" width="60" height="7" rx="3" fill="#00000022" />
          <path d="M92 216 L148 216 L184 326 L56 326 Z" fill={topFill} />
          <path d="M56 326 q14 12 28 0 q14 12 28 0 q14 12 28 0 q14 12 28 0 q14 12 16 0" fill="none" stroke={topCol} strokeWidth="7" strokeLinejoin="round" />
          <path d="M90 160 L64 212 L80 220 L100 172 Z" fill={topCol} />
          <path d="M150 160 L176 212 L160 220 L140 172 Z" fill={topCol} />
        </g>
      ) : a.top === 'suit' ? (
        <g>
          {/* jacket */}
          <path d={girl
            ? 'M86 158 Q120 150 154 158 L160 256 Q120 250 80 256 Z'
            : 'M78 157 Q120 150 162 157 L168 256 L72 256 Z'} fill={topFill} />
          {/* white shirt wedge */}
          <path d="M108 158 L120 210 L132 158 Z" fill="#ffffff" />
          {/* lapels */}
          <path d="M108 158 L120 186 L111 206 L100 170 Z" fill={topCol} stroke="#00000022" strokeWidth="1.5" />
          <path d="M132 158 L120 186 L129 206 L140 170 Z" fill={topCol} stroke="#00000022" strokeWidth="1.5" />
          {/* tie */}
          <path d="M120 186 l-6 10 l6 30 l6 -30 Z" fill={accent} />
          {/* sleeves */}
          <path d={girl ? 'M86 160 L64 202 L80 211 L98 172 Z' : 'M78 158 L58 200 L76 210 L94 171 Z'} fill={topCol} />
          <path d={girl ? 'M154 160 L176 202 L160 211 L142 172 Z' : 'M162 158 L182 200 L164 210 L146 171 Z'} fill={topCol} />
        </g>
      ) : (
        <>
          {/* shirt/top — boys broader squarer shoulders; girls narrower tapered */}
          <path d={girl
            ? 'M88 158 Q120 148 152 158 L158 256 Q120 250 82 256 Z'
            : 'M80 157 Q120 150 160 157 L166 256 L74 256 Z'} fill={topFill} />
          <path d={girl ? 'M88 160 L66 202 L82 211 L100 172 Z' : 'M80 158 L60 200 L78 210 L96 171 Z'} fill={topCol} />
          <path d={girl ? 'M152 160 L174 202 L158 211 L140 172 Z' : 'M160 158 L180 200 L162 210 L144 171 Z'} fill={topCol} />
          <path d="M108 156 L120 168 L132 156 Z" fill="#ffffff40" />
        </>
      )}

      {/* belt (over the waist) */}
      {a.belt && a.top !== 'dress' && (
        <>
          <rect x="86" y="246" width="68" height="9" rx="2" fill="#3a2d22" />
          <rect x="114" y="247" width="12" height="7" rx="1" fill={accent} />
        </>
      )}

      {/* lower arms */}
      <rect x={girl ? 66 : 60} y="200" width="16" height="56" rx="8" fill={SK} />
      <rect x={girl ? 158 : 164} y="200" width="16" height="56" rx="8" fill={SK} />

      {/* hands or gloves */}
      {a.gloves ? (
        <>
          <circle cx={girl ? 74 : 68} cy="256" r="10" fill={accent} />
          <circle cx={girl ? 166 : 172} cy="256" r="10" fill={accent} />
        </>
      ) : (
        <>
          <circle cx={girl ? 74 : 68} cy="256" r="9" fill={SKD} />
          <circle cx={girl ? 166 : 172} cy="256" r="9" fill={SKD} />
        </>
      )}

      {/* watch (on the left wrist) */}
      {a.watch && (
        <rect x={girl ? 64 : 58} y="244" width="16" height="8" rx="2" fill="#1f2937" stroke={accent} strokeWidth="2" />
      )}

      {/* head */}
      <ellipse cx="120" cy="90" rx="47" ry="53" fill={SK} />
      {!girl && <path d="M86 108 Q120 150 154 108 Q150 140 120 142 Q90 140 86 108 Z" fill={SK} />}
      <ellipse cx="72" cy="94" rx="8" ry="11" fill={SK} />
      <ellipse cx="168" cy="94" rx="8" ry="11" fill={SK} />
      {!girl && (
        <>
          <rect x="74" y="86" width="6" height="22" rx="3" fill={hairCol} />
          <rect x="160" y="86" width="6" height="22" rx="3" fill={hairCol} />
        </>
      )}
      <circle cx="96" cy="104" r={girl ? 8 : 6} fill={girl ? '#ff8aa540' : '#ff9a9a30'} />
      <circle cx="144" cy="104" r={girl ? 8 : 6} fill={girl ? '#ff8aa540' : '#ff9a9a30'} />
      <ellipse cx="103" cy="90" rx="5.5" ry="6.5" fill="#2b2b2b" />
      <ellipse cx="137" cy="90" rx="5.5" ry="6.5" fill="#2b2b2b" />
      <circle cx="105" cy="88" r="1.8" fill="#fff" />
      <circle cx="139" cy="88" r="1.8" fill="#fff" />
      {girl && (
        <g stroke="#2b2b2b" strokeWidth="1.6" strokeLinecap="round">
          <path d="M96 85 l-5 -3 M98 83 l-4 -4 M100 82 l-2 -4" fill="none" />
          <path d="M144 85 l5 -3 M142 83 l4 -4 M140 82 l2 -4" fill="none" />
        </g>
      )}
      {girl ? (
        <>
          <path d="M95 79 q8 -4 16 0" stroke={hairCol} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M129 79 q8 -4 16 0" stroke={hairCol} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="94" y="76" width="18" height="4" rx="2" fill={hairCol} />
          <rect x="128" y="76" width="18" height="4" rx="2" fill={hairCol} />
        </>
      )}
      <path d="M120 96 l-4 11 h8 Z" fill={SKD} />
      {girl
        ? <path d="M110 117 Q120 127 130 117 Q120 122 110 117 Z" fill="#e06b8b" />
        : <path d="M107 117 Q120 128 133 117" stroke="#b5654a" strokeWidth="3" fill="none" strokeLinecap="round" />}

      {/* scarf (around the neck, over the collar) */}
      {a.scarf && (
        <g>
          <path d="M100 150 Q120 164 140 150 L140 160 Q120 174 100 160 Z" fill={accent} />
          <path d="M126 160 l10 34 l-12 0 l-6 -30 Z" fill={accent} />
        </g>
      )}

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
      {a.hair === 'straight' && (
        <>
          {/* centre parting, sleek front */}
          <path d="M70 92 Q72 40 120 38 Q168 40 170 92 Q150 60 122 60 L122 92 L118 92 L118 60 Q90 60 70 92 Z" fill={hairCol} />
        </>
      )}
      {a.hair === 'short' && (
        <path d="M74 82 Q76 42 120 40 Q164 42 166 82 Q150 58 120 60 Q90 58 74 82 Z" fill={hairCol} />
      )}
      {a.hair === 'ponytail' && (
        <>
          <path d="M74 82 Q76 42 120 40 Q164 42 166 82 Q150 58 120 60 Q90 58 74 82 Z" fill={hairCol} />
          {/* tail off the right side */}
          <path d="M164 78 Q196 92 192 140 Q188 168 172 176 Q184 150 178 120 Q174 96 158 90 Z" fill={hairCol} />
          <circle cx="166" cy="80" r="7" fill={accent} />
        </>
      )}

      {/* girl hair bow */}
      {girl && (
        <g>
          <path d="M120 42 L102 33 L102 51 Z" fill="#ef4444" />
          <path d="M120 42 L138 33 L138 51 Z" fill="#ef4444" />
          <path d="M120 42 L102 33 L102 51 Z" fill="none" stroke="#c0271f" strokeWidth="1.5" />
          <path d="M120 42 L138 33 L138 51 Z" fill="none" stroke="#c0271f" strokeWidth="1.5" />
          <circle cx="120" cy="42" r="5" fill="#dc2626" />
        </g>
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
