import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Anton';

const { fontFamily } = loadFont();

// ============================================================
// CONFIGURAÇÃO — ajuste cores, tempos e textos aqui
// ============================================================
export const CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 660, // 22s
  // cores oficiais, extraídas dos SVGs da marca
  colors: {
    bg: '#0A0A0A',
    text: '#FFFFFF',
    accent: '#F5FD07', // amarelo-limão "GAMES"
    cyan: '#32F6F6', // ciano "WOLVER"
    blue: '#009EDD', // azul do lobo
    navy: '#09507D',
    sky: '#8CE1F9',
  },
  logos: {
    games: 'wolver-games.svg', // 601x119
    wolver: 'wolver-logo.svg', // 330x322
  },
  safe: { x: 120, y: 250 },
  // [início, duração] em frames
  scenes: {
    intro: { from: 0, duration: 60 },
    attention: { from: 60, duration: 45 },
    lastWeek: { from: 105, duration: 90 },
    deadline: { from: 195, duration: 120 },
    event: { from: 315, duration: 120 },
    dontWait: { from: 435, duration: 90 },
    final: { from: 525, duration: 135 },
  },
  text: {
    attention: 'ATENÇÃO',
    lastWeek: ['ÚLTIMA', 'SEMANA DE', 'INSCRIÇÕES'],
    deadline: {
      label: 'INSCRIÇÕES ATÉ',
      day: '30',
      month: 'OUTUBRO',
      weekday: 'SEXTA-FEIRA',
    },
    event: {
      label: 'O GRANDE DIA',
      day: '21',
      month: 'NOVEMBRO',
      weekday: 'SÁBADO',
    },
    dontWait: ['NÃO DEIXE', 'PRA', 'DEPOIS'],
    replacement: 'FAÇA AGORA',
    cta: 'GARANTA SUA VAGA',
    recap: [
      { label: 'INSCRIÇÕES ATÉ', value: '30/10' },
      { label: 'EVENTO', value: '21/11' },
    ],
  },
};

const C = CONFIG.colors;

// ============================================================
// Utilitários
// ============================================================
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Safe: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <AbsoluteFill
    style={{
      padding: `${CONFIG.safe.y}px ${CONFIG.safe.x}px`,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      fontFamily,
      color: C.text,
      textTransform: 'uppercase',
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

// Whip-pan: desfoque + deslocamento horizontal na entrada e na saída da cena
const WhipPan: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const inX = interpolate(frame, [0, 5], [400, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outX = interpolate(frame, [duration - 4, duration], [0, -400], clamp);
  const x = inX + outX;
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, filter: `blur(${Math.abs(x) / 25}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

// Flash branco curto no início de uma cena
const Flash: React.FC<{ at?: number; peak?: number }> = ({ at = 0, peak = 0.8 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + 7], [0, peak, 0], clamp);
  return <AbsoluteFill style={{ backgroundColor: 'white', opacity: o }} />;
};

const useShake = (start: number, amount = 24, length = 12) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [start, start + length], [amount, 0], clamp);
  return `translate(${(random(`sx${frame}`) - 0.5) * a}px, ${(random(`sy${frame}`) - 0.5) * a}px)`;
};

// ============================================================
// Fundo: grão, vinheta e linhas de velocidade
// ============================================================
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = new Array(18).fill(0).map((_, i) => {
    const speed = 30 + random(`s${i}`) * 50;
    const len = 120 + random(`l${i}`) * 260;
    const y = random(`y${i}`) * CONFIG.height;
    const x = ((frame * speed + random(`x${i}`) * 3000) % (CONFIG.width + len * 2)) - len;
    const color = i % 3 === 0 ? '50,246,246' : '255,255,255';
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: len,
          height: 2,
          background: `linear-gradient(90deg, transparent, rgba(${color},${0.05 + random(`o${i}`) * 0.12}))`,
        }}
      />
    );
  });
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {lines}
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.12, mixBlendMode: 'screen' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.85) 100%)' }}
      />
    </AbsoluteFill>
  );
};

// ============================================================
// Cena 0 — Abertura com a logo Wolver Games
// ============================================================
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const glitch = frame % 14 < 3 && frame > 8;
  const dx = glitch ? (random(`ig${frame}`) - 0.5) * 30 : 0;
  return (
    <AbsoluteFill style={{ transform: useShake(5, 18) }}>
      <Safe>
        <div style={{ position: 'relative', width: 840, transform: `scale(${interpolate(s, [0, 1], [2.4, 1])})` }}>
          {glitch && (
            <Img
              src={staticFile(CONFIG.logos.games)}
              style={{ position: 'absolute', width: 840, left: -10 + dx, opacity: 0.6, filter: 'hue-rotate(160deg)' }}
            />
          )}
          <Img
            src={staticFile(CONFIG.logos.games)}
            style={{ width: 840, transform: `translateX(${dx / 2}px)`, filter: `drop-shadow(0 0 30px ${C.cyan}88)` }}
          />
        </div>
        <div
          style={{
            marginTop: 50,
            fontSize: 90,
            letterSpacing: 30,
            color: C.accent,
            opacity: interpolate(frame, [14, 22], [0, 1], clamp),
            transform: `translateY(${interpolate(frame, [14, 22], [30, 0], clamp)}px)`,
          }}
        >
          2026
        </div>
      </Safe>
      <Flash at={5} />
    </AbsoluteFill>
  );
};

// ============================================================
// Cena 1 — ATENÇÃO
// ============================================================
const SceneAttention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const impact = 6;
  const line = spring({ frame: frame - impact, fps, config: { damping: 20, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ transform: useShake(impact) }}>
      <Safe>
        <div style={{ fontSize: 210, lineHeight: 1, transform: `scale(${interpolate(s, [0, 1], [3, 1])})`, letterSpacing: 4 }}>
          {CONFIG.text.attention}
        </div>
        <div style={{ marginTop: 40, height: 16, width: 760 * line, background: C.accent, boxShadow: `0 0 30px ${C.accent}` }} />
      </Safe>
      <Flash at={impact} peak={0.9} />
    </AbsoluteFill>
  );
};

// ============================================================
// Cena 2 — ÚLTIMA SEMANA DE INSCRIÇÕES
// ============================================================
const GlitchWord: React.FC<{ word: string }> = ({ word }) => {
  const frame = useCurrentFrame();
  const active = frame % 18 < 4;
  const dx = active ? (random(`g${frame}`) - 0.5) * 40 : 0;
  const split = active ? 10 : 3;
  return (
    <span style={{ position: 'relative', display: 'inline-block', color: C.accent }}>
      <span style={{ position: 'absolute', left: -split + dx, top: 0, color: '#FF003C', mixBlendMode: 'screen' }}>{word}</span>
      <span style={{ position: 'absolute', left: split - dx, top: 0, color: C.cyan, mixBlendMode: 'screen' }}>{word}</span>
      <span style={{ position: 'relative', transform: `translateX(${dx / 2}px)`, display: 'inline-block' }}>{word}</span>
    </span>
  );
};

const SceneLastWeek: React.FC = () => {
  const frame = useCurrentFrame();
  const stagger = 8;
  const [first, ...rest] = CONFIG.text.lastWeek;
  return (
    <Safe>
      <div style={{ lineHeight: 1.1 }}>
        {[first, ...rest].map((w, i) => {
          const local = frame - i * stagger;
          const o = interpolate(local, [0, 6], [0, 1], clamp);
          const y = interpolate(local, [0, 8], [60, 0], { ...clamp, easing: Easing.out(Easing.back(2)) });
          return (
            <div key={w} style={{ opacity: o, transform: `translateY(${y}px)`, fontSize: i === 0 ? 250 : 140 }}>
              {i === 0 ? <GlitchWord word={w} /> : w}
            </div>
          );
        })}
      </div>
    </Safe>
  );
};

// ============================================================
// Cartão de data (usado nas cenas de prazo e de evento)
// ============================================================
const DateCard: React.FC<{
  label: string;
  day: string;
  month: string;
  weekday: string;
  color: string;
  header?: React.ReactNode;
}> = ({ label, day, month, weekday, color, header }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labelIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const dayS = spring({ frame: frame - 8, fps, config: { damping: 10, stiffness: 200, mass: 0.7 } });
  const monthIn = spring({ frame: frame - 18, fps, config: { damping: 16, stiffness: 180 } });
  const weekIn = interpolate(frame, [28, 36], [0, 1], clamp);
  const glow = 0.6 + 0.4 * Math.sin(frame / 6);
  return (
    <Safe>
      {header}
      <div
        style={{
          fontSize: 92,
          letterSpacing: 4,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 40}px)`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 560,
          lineHeight: 0.95,
          color,
          transform: `scale(${interpolate(dayS, [0, 1], [2.5, 1])})`,
          opacity: Math.min(1, dayS * 2),
          textShadow: `0 0 ${60 * glow}px ${color}88`,
        }}
      >
        {day}
      </div>
      <div
        style={{
          background: color,
          color: C.bg,
          fontSize: 130,
          lineHeight: 1,
          padding: '14px 40px 18px',
          transform: `translateX(${interpolate(monthIn, [0, 1], [-1300, 0])}px) skewX(-6deg)`,
        }}
      >
        {month}
      </div>
      <div style={{ marginTop: 34, fontSize: 70, letterSpacing: 12, opacity: weekIn }}>{weekday}</div>
    </Safe>
  );
};

const SceneDeadline: React.FC = () => {
  const d = CONFIG.text.deadline;
  return (
    <AbsoluteFill style={{ transform: useShake(8, 20) }}>
      <DateCard label={d.label} day={d.day} month={d.month} weekday={d.weekday} color={C.accent} />
      <Flash at={8} peak={0.6} />
    </AbsoluteFill>
  );
};

const SceneEvent: React.FC = () => {
  const frame = useCurrentFrame();
  const e = CONFIG.text.event;
  const logoIn = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ transform: useShake(8, 20) }}>
      <DateCard
        label={e.label}
        day={e.day}
        month={e.month}
        weekday={e.weekday}
        color={C.cyan}
        header={
          <Img
            src={staticFile(CONFIG.logos.games)}
            style={{ width: 620, marginBottom: 40, opacity: logoIn, transform: `translateY(${(1 - logoIn) * -40}px)` }}
          />
        }
      />
      <Flash at={8} peak={0.6} />
    </AbsoluteFill>
  );
};

// ============================================================
// Cena — NÃO DEIXE PRA DEPOIS → FAÇA AGORA
// ============================================================
const SceneDontWait: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = CONFIG.text.dontWait;
  const drop = 6;
  const strikeStart = lines.length * drop + 14;
  const strike = interpolate(frame, [strikeStart, strikeStart + 8], [0, 1], clamp);
  const replace = spring({ frame: frame - strikeStart - 10, fps, config: { damping: 9, stiffness: 220 } });
  const pulse = frame > strikeStart + 20 ? interpolate((frame - strikeStart - 20) % 12, [0, 5, 12], [1, 1.1, 1]) : 1;
  return (
    <Safe>
      <div style={{ fontSize: 170, lineHeight: 1.1 }}>
        {lines.map((l, i) => {
          const s = spring({ frame: frame - i * drop, fps, config: { damping: 8, stiffness: 200, mass: 0.7 } });
          const isLast = i === lines.length - 1;
          return (
            <div key={l} style={{ transform: `translateY(${interpolate(s, [0, 1], [-900, 0])}px)` }}>
              <span style={{ position: 'relative', opacity: isLast ? 1 - strike * 0.6 : 1 }}>
                {l}
                {isLast && (
                  <span
                    style={{
                      position: 'absolute',
                      left: -14,
                      top: '50%',
                      height: 20,
                      width: `calc(${strike * 100}% + 28px)`,
                      background: '#FF2D2D',
                      transform: 'translateY(-50%) rotate(-4deg)',
                    }}
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 40,
          color: C.accent,
          fontSize: 160,
          whiteSpace: 'nowrap',
          lineHeight: 1,
          transform: `scale(${replace * pulse})`,
          textShadow: `0 0 40px ${C.accent}66`,
        }}
      >
        {CONFIG.text.replacement}
      </div>
    </Safe>
  );
};

// ============================================================
// Fechamento — logo oficial Wolver + CTA + resumo das datas
// ============================================================
const SceneFinal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const cta = spring({ frame: frame - 14, fps, config: { damping: 12, stiffness: 180 } });
  const pulse = frame > 30 ? 1 + 0.04 * Math.sin(((frame - 30) / fps) * Math.PI * 3) : 1;
  const fadeOut = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
  return (
    <Safe style={{ justifyContent: 'space-between', opacity: fadeOut }}>
      <Img
        src={staticFile(CONFIG.logos.wolver)}
        style={{
          width: 470,
          transform: `scale(${interpolate(logo, [0, 1], [0.5, 1])})`,
          opacity: Math.min(1, logo * 1.5),
          filter: `drop-shadow(0 0 40px ${C.blue}66)`,
        }}
      />
      <div
        style={{
          width: 840,
          background: C.accent,
          color: C.bg,
          fontSize: 104,
          lineHeight: 1,
          padding: '34px 0 40px',
          opacity: cta,
          transform: `translateY(${(1 - cta) * 80}px) scale(${pulse})`,
          boxShadow: `0 0 ${50 * pulse}px ${C.accent}88`,
        }}
      >
        {CONFIG.text.cta}
      </div>
      <div style={{ display: 'flex', gap: 30, width: 840 }}>
        {CONFIG.text.recap.map((r, i) => {
          const s = spring({ frame: frame - 26 - i * 6, fps, config: { damping: 14 } });
          const color = i === 0 ? C.accent : C.cyan;
          return (
            <div
              key={r.label}
              style={{
                flex: 1,
                border: `6px solid ${color}`,
                padding: '20px 0 24px',
                opacity: s,
                transform: `translateY(${(1 - s) * 60}px)`,
              }}
            >
              <div style={{ fontSize: 40, letterSpacing: 3 }}>{r.label}</div>
              <div style={{ fontSize: 120, lineHeight: 1, color }}>{r.value}</div>
            </div>
          );
        })}
      </div>
      <Img
        src={staticFile(CONFIG.logos.games)}
        style={{ width: 520, opacity: interpolate(frame, [40, 50], [0, 1], clamp) }}
      />
    </Safe>
  );
};

// ============================================================
// Composição principal
// ============================================================
export const WolverReels: React.FC = () => {
  const s = CONFIG.scenes;
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={s.intro.from} durationInFrames={s.intro.duration}>
        <SceneIntro />
      </Sequence>
      <Sequence from={s.attention.from} durationInFrames={s.attention.duration}>
        <SceneAttention />
      </Sequence>
      <Sequence from={s.lastWeek.from} durationInFrames={s.lastWeek.duration}>
        <WhipPan duration={s.lastWeek.duration}>
          <SceneLastWeek />
        </WhipPan>
      </Sequence>
      <Sequence from={s.deadline.from} durationInFrames={s.deadline.duration}>
        <WhipPan duration={s.deadline.duration}>
          <SceneDeadline />
        </WhipPan>
      </Sequence>
      <Sequence from={s.event.from} durationInFrames={s.event.duration}>
        <WhipPan duration={s.event.duration}>
          <SceneEvent />
        </WhipPan>
      </Sequence>
      <Sequence from={s.dontWait.from} durationInFrames={s.dontWait.duration}>
        <SceneDontWait />
      </Sequence>
      <Sequence from={s.final.from} durationInFrames={s.final.duration}>
        <SceneFinal />
      </Sequence>
    </AbsoluteFill>
  );
};
