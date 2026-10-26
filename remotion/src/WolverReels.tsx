import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
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
  durationInFrames: 240,
  colors: {
    bg: '#0A0A0A',
    text: '#FFFFFF',
    accent: '#FFD400',
    accentAlt: '#E10600',
  },
  safe: { x: 120, y: 250 },
  // [início, duração] em frames
  scenes: {
    attention: { from: 0, duration: 45 },
    lastWeek: { from: 45, duration: 75 },
    now: { from: 120, duration: 75 },
    dontWait: { from: 195, duration: 45 },
  },
  beat: 8, // ~0,25s a 30fps
  text: {
    attention: 'ATENÇÃO',
    lastWeek: ['ÚLTIMA', 'SEMANA', 'DE', 'INSCRIÇÕES'],
    highlightWord: 'ÚLTIMA',
    event: 'WOLVER GAMES 2026',
    eventTag: 'NOV 21',
    now: ['A HORA', 'É', 'AGORA'],
    pulseWord: 'AGORA',
    urgency: 'VAGAS SE ESGOTANDO',
    dontWait: ['NÃO DEIXE', 'PRA', 'DEPOIS'],
    struckWord: 'DEPOIS',
    replacement: 'AGORA',
    cta: 'GARANTA SUA VAGA',
  },
};

const C = CONFIG.colors;

// ============================================================
// Utilitários
// ============================================================
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

// Whip-pan: desfoque + deslocamento horizontal nos primeiros/últimos frames da cena
const WhipPan: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const inX = interpolate(frame, [0, 5], [400, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const outX = interpolate(frame, [duration - 4, duration], [0, -400], {
    extrapolateLeft: 'clamp',
  });
  const x = inX + outX;
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, filter: `blur(${Math.abs(x) / 25}px)` }}>
      {children}
    </AbsoluteFill>
  );
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
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: len,
          height: 2,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.05 + random(`o${i}`) * 0.1}))`,
        }}
      />
    );
  });
  // seed muda a cada 2 frames para o grão "ferver"
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
// Cena 1 — ATENÇÃO
// ============================================================
const SceneAttention: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [3, 1]);
  const impact = 6; // frame aproximado do impacto
  const shakeAmt = interpolate(frame, [impact, impact + 12], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sx = (random(`sx${frame}`) - 0.5) * shakeAmt;
  const sy = (random(`sy${frame}`) - 0.5) * shakeAmt;
  const flash = interpolate(frame, [impact, impact + 2, impact + 7], [0, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line = spring({ frame: frame - impact, fps, config: { damping: 20, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <Safe>
        <div style={{ fontSize: 210, lineHeight: 1, transform: `scale(${scale})`, letterSpacing: 4 }}>
          {CONFIG.text.attention}
        </div>
        <div
          style={{
            marginTop: 40,
            height: 16,
            width: 760 * line,
            background: C.accent,
            boxShadow: `0 0 30px ${C.accent}`,
          }}
        />
      </Safe>
      <AbsoluteFill style={{ backgroundColor: 'white', opacity: flash }} />
    </AbsoluteFill>
  );
};

// ============================================================
// Cena 2 — ÚLTIMA SEMANA DE INSCRIÇÕES
// ============================================================
const GlitchWord: React.FC<{ word: string }> = ({ word }) => {
  const frame = useCurrentFrame();
  // glitch em rajadas curtas
  const active = frame % 18 < 4;
  const dx = active ? (random(`g${frame}`) - 0.5) * 40 : 0;
  const split = active ? 10 : 3;
  return (
    <span style={{ position: 'relative', display: 'inline-block', color: C.accent }}>
      <span style={{ position: 'absolute', left: -split + dx, top: 0, color: '#FF003C', mixBlendMode: 'screen' }}>
        {word}
      </span>
      <span style={{ position: 'absolute', left: split - dx, top: 0, color: '#00E5FF', mixBlendMode: 'screen' }}>
        {word}
      </span>
      <span style={{ position: 'relative', transform: `translateX(${dx / 2}px)`, display: 'inline-block' }}>
        {word}
      </span>
    </span>
  );
};

const SceneLastWeek: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stagger = 7;
  const words = CONFIG.text.lastWeek;
  const bandStart = words.length * stagger + 4;
  const band = spring({ frame: frame - bandStart, fps, config: { damping: 16, stiffness: 180 } });
  const tag = spring({ frame: frame - bandStart - 8, fps, config: { damping: 9, stiffness: 200 } });

  return (
    <Safe>
      <div style={{ fontSize: 150, lineHeight: 1.15 }}>
        {words.map((w, i) => {
          const local = frame - i * stagger;
          const o = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(local, [0, 8], [60, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.back(2)),
          });
          return (
            <div key={w} style={{ opacity: o, transform: `translateY(${y}px)` }}>
              {w === CONFIG.text.highlightWord ? <GlitchWord word={w} /> : w}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 70,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          transform: `translateX(${interpolate(band, [0, 1], [-1300, 0])}px)`,
        }}
      >
        <div style={{ background: C.text, color: C.bg, fontSize: 64, padding: '14px 28px', letterSpacing: 2 }}>
          {CONFIG.text.event}
        </div>
        <div
          style={{
            background: C.accent,
            color: C.bg,
            fontSize: 56,
            padding: '14px 20px',
            transform: `scale(${tag}) rotate(-4deg)`,
          }}
        >
          {CONFIG.text.eventTag}
        </div>
      </div>
    </Safe>
  );
};

// ============================================================
// Cena 3 — A HORA É AGORA
// ============================================================
const SceneNow: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const beat = CONFIG.beat;
  const lines = CONFIG.text.now;
  const pulseStart = lines.length * beat;
  const pulse =
    frame >= pulseStart
      ? interpolate((frame - pulseStart) % 10, [0, 4, 10], [1, 1.15, 1])
      : 1;
  const progress = interpolate(frame, [0, durationInFrames - 5], [0, 1], { extrapolateRight: 'clamp' });
  const countdown = Math.max(0, Math.ceil(7 * (1 - progress)));

  return (
    <Safe>
      <div style={{ fontSize: 190, lineHeight: 1.1 }}>
        {lines.map((l, i) => {
          // corte seco: aparece de uma vez no beat
          const visible = frame >= i * beat;
          const isPulse = l === CONFIG.text.pulseWord;
          return (
            <div
              key={l}
              style={{
                visibility: visible ? 'visible' : 'hidden',
                color: isPulse ? C.accent : C.text,
                transform: isPulse ? `scale(${pulse})` : undefined,
                fontSize: isPulse ? 260 : undefined,
              }}
            >
              {l}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 80, width: 840 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 44, marginBottom: 16 }}>
          <span>{CONFIG.text.urgency}</span>
          <span style={{ color: C.accentAlt }}>{countdown} DIAS</span>
        </div>
        <div style={{ height: 22, background: 'rgba(255,255,255,0.15)' }}>
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${C.accent}, ${C.accentAlt})`,
            }}
          />
        </div>
      </div>
    </Safe>
  );
};

// ============================================================
// Cena 4 — NÃO DEIXE PRA DEPOIS + CTA
// ============================================================
const SceneDontWait: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const lines = CONFIG.text.dontWait;
  const drop = 4;
  const strikeStart = lines.length * drop + 6;
  const strike = interpolate(frame, [strikeStart, strikeStart + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const replace = spring({ frame: frame - strikeStart - 6, fps, config: { damping: 10, stiffness: 220 } });
  const ctaIn = spring({ frame: frame - strikeStart - 10, fps, config: { damping: 14 } });
  // pulso leve no último 1s (30 frames) do vídeo
  const pulseFrom = durationInFrames - fps;
  const ctaPulse = frame >= pulseFrom ? 1 + 0.05 * Math.sin(((frame - pulseFrom) / fps) * Math.PI * 4) : 1;

  return (
    <Safe>
      <div style={{ fontSize: 150, lineHeight: 1.1 }}>
        {lines.map((l, i) => {
          const s = spring({ frame: frame - i * drop, fps, config: { damping: 8, stiffness: 200, mass: 0.7 } });
          const y = interpolate(s, [0, 1], [-900, 0]);
          const isStruck = l === CONFIG.text.struckWord;
          return (
            <div key={l} style={{ transform: `translateY(${y}px)`, position: 'relative' }}>
              <span style={{ position: 'relative', opacity: isStruck ? 1 - strike * 0.5 : 1 }}>
                {l}
                {isStruck && (
                  <span
                    style={{
                      position: 'absolute',
                      left: -10,
                      top: '50%',
                      height: 16,
                      width: `calc(${strike * 100}% + 20px)`,
                      background: C.accentAlt,
                      transform: 'translateY(-50%) rotate(-3deg)',
                    }}
                  />
                )}
              </span>
            </div>
          );
        })}
        <div style={{ color: C.accent, fontSize: 190, transform: `scale(${replace})` }}>
          {CONFIG.text.replacement}
        </div>
      </div>
      <div
        style={{
          marginTop: 50,
          border: `8px solid ${C.accent}`,
          padding: '22px 44px',
          fontSize: 76,
          opacity: ctaIn,
          transform: `scale(${interpolate(ctaIn, [0, 1], [0.6, 1]) * ctaPulse})`,
          boxShadow: `0 0 ${40 * (ctaPulse - 0.95) * 10}px ${C.accent}`,
        }}
      >
        {CONFIG.text.cta}
      </div>
    </Safe>
  );
};

// ============================================================
// Composição principal
// ============================================================
export const WolverReels: React.FC = () => {
  const { scenes } = CONFIG;
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={scenes.attention.from} durationInFrames={scenes.attention.duration}>
        <SceneAttention />
      </Sequence>
      <Sequence from={scenes.lastWeek.from} durationInFrames={scenes.lastWeek.duration}>
        <WhipPan duration={scenes.lastWeek.duration}>
          <SceneLastWeek />
        </WhipPan>
      </Sequence>
      {/* corte seco */}
      <Sequence from={scenes.now.from} durationInFrames={scenes.now.duration}>
        <SceneNow />
      </Sequence>
      <Sequence from={scenes.dontWait.from} durationInFrames={scenes.dontWait.duration}>
        <SceneDontWait />
      </Sequence>
    </AbsoluteFill>
  );
};
