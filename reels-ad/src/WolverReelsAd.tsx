import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/fonts';

const fontFamily = 'Anton';
loadFont({family: fontFamily, url: staticFile('fonts/Anton.woff2')});

// ============================================================
// CONFIGURAÇÃO — ajuste cores, tempos, textos e logo aqui
// ============================================================
export const CONFIG = {
  video: {width: 1080, height: 1920, fps: 30, durationInFrames: 180},
  colors: {
    bg: '#0A0A0A',
    white: '#FFFFFF',
    yellow: '#FFD400',
    red: '#E10600',
  },
  safeArea: {x: 120, y: 250},
  // Durações em frames (30 fps)
  scenes: {
    attention: {from: 0, duration: 45}, // 0 – 1,5s
    lastDay: {from: 45, duration: 75}, // 1,5 – 4s
    cta: {from: 120, duration: 60}, // 4 – 6s
  },
  // Frame (relativo à cena 2) em que cada palavra entra — alinhe com a batida da trilha
  wordBeats: [0, 14, 28, 42],
  texts: {
    attention: 'ATENÇÃO',
    lastDay: [
      {word: 'ÚLTIMO', color: 'yellow', glitch: true, hardCut: false},
      {word: 'DIA', color: 'white', glitch: false, hardCut: true},
      {word: 'DE', color: 'white', glitch: false, hardCut: false},
      {word: 'INSCRIÇÃO', color: 'red', glitch: false, hardCut: true},
    ],
    cta: 'GARANTA SUA VAGA AGORA',
    urgency: 'VAGAS ENCERRANDO',
  },
  logo: 'logo-wolver-games.svg', // arquivo em /public
  whipFrames: 6, // duração do whip-pan entre cenas
} as const;

const C = CONFIG.colors;
type ColorKey = keyof typeof C;

// ============================================================
// FUNDO: grão, vinheta, linhas de velocidade, partículas
// ============================================================
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 8; // troca o padrão do ruído a cada frame
  return (
    <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}}
  />
);

const SpeedLines: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{opacity: 0.35}}>
      {new Array(18).fill(0).map((_, i) => {
        const speed = 30 + random(`s${i}`) * 50;
        const len = 150 + random(`l${i}`) * 350;
        const x = random(`x${i}`) * width;
        const y = ((random(`y${i}`) * (height + len) + frame * speed) % (height + len)) - len;
        const isAccent = i % 6 === 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: isAccent ? 3 : 2,
              height: len,
              background: `linear-gradient(to bottom, transparent, ${isAccent ? C.yellow : C.white})`,
              opacity: 0.25 + random(`o${i}`) * 0.4,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      {new Array(30).fill(0).map((_, i) => {
        const size = 3 + random(`ps${i}`) * 6;
        const x = random(`px${i}`) * width + Math.sin(frame / 20 + i) * 20;
        const y = height - ((random(`py${i}`) * height + frame * (2 + random(`pv${i}`) * 4)) % height);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: C.yellow,
              opacity: 0.15 + random(`po${i}`) * 0.35,
              boxShadow: `0 0 ${size * 3}px ${C.yellow}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Container de área segura para textos e logo
const Safe: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill
    style={{
      padding: `${CONFIG.safeArea.y}px ${CONFIG.safeArea.x}px`,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      fontFamily,
      textTransform: 'uppercase',
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

// Whip-pan: desfoque horizontal + deslocamento nas bordas da cena
const useWhip = (duration: number) => {
  const frame = useCurrentFrame();
  const w = CONFIG.whipFrames;
  const inX = interpolate(frame, [0, w], [600, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outX = interpolate(frame, [duration - w, duration], [0, -600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = inX + outX;
  return {transform: `translateX(${x}px)`, filter: `blur(${Math.abs(x) / 25}px)`};
};

// ============================================================
// CENA 1 — ATENÇÃO
// ============================================================
const SceneAttention: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = CONFIG.scenes.attention;

  const impact = spring({frame, fps, config: {damping: 9, stiffness: 220, mass: 0.6}});
  const scale = interpolate(impact, [0, 1], [3, 1]);
  const opacity = interpolate(frame, [0, 3], [0, 1], {extrapolateRight: 'clamp'});

  // Impacto ocorre por volta do frame 6
  const shakeAmt = interpolate(frame, [5, 18], [28, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shakeX = (random(`sx${frame}`) - 0.5) * shakeAmt;
  const shakeY = (random(`sy${frame}`) - 0.5) * shakeAmt;

  const flash = interpolate(frame, [5, 7, 12], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const line = spring({frame: frame - 10, fps, config: {damping: 14, stiffness: 160}});
  const whip = useWhip(duration);

  return (
    <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px)`}}>
      <Safe style={whip}>
        <div style={{transform: `scale(${scale})`, opacity}}>
          <div style={{fontSize: 200, color: C.white, lineHeight: 1, letterSpacing: 6}}>
            {CONFIG.texts.attention}
          </div>
          <div
            style={{
              height: 22,
              marginTop: 30,
              marginInline: 'auto',
              width: `${line * 100}%`,
              background: C.yellow,
              boxShadow: `0 0 30px ${C.yellow}`,
            }}
          />
        </div>
      </Safe>
      <AbsoluteFill style={{background: C.white, opacity: flash}} />
    </AbsoluteFill>
  );
};

// ============================================================
// CENA 2 — ÚLTIMO DIA DE INSCRIÇÃO
// ============================================================
const GlitchWord: React.FC<{text: string; color: string; localFrame: number}> = ({text, color, localFrame}) => {
  // Glitch forte nos primeiros frames + "soluços" periódicos
  const burst = localFrame < 10 || localFrame % 22 < 3;
  const amp = burst ? 10 + random(`ga${localFrame}`) * 22 : 0;
  const jitter = burst ? (random(`gj${localFrame}`) - 0.5) * 50 : 0;
  const sliceTop = random(`st${localFrame}`) * 70;
  const layer = (c: string, dx: number, blend: React.CSSProperties['mixBlendMode']): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    color: c,
    transform: `translateX(${dx}px)`,
    mixBlendMode: blend,
  });
  return (
    <div style={{position: 'relative', transform: `translateX(${jitter}px)`}}>
      <span style={{color, visibility: 'visible'}}>{text}</span>
      {burst && (
        <>
          <span style={layer('#FF0040', -amp, 'screen')}>{text}</span>
          <span style={layer('#00E5FF', amp, 'screen')}>{text}</span>
          <span
            style={{
              ...layer(color, jitter * 1.5, 'normal'),
              clipPath: `inset(${sliceTop}% 0 ${100 - sliceTop - 12}% 0)`,
            }}
          >
            {text}
          </span>
        </>
      )}
    </div>
  );
};

const SceneLastDay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = CONFIG.scenes.lastDay;
  const whip = useWhip(duration);

  return (
    <Safe style={whip}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, lineHeight: 1.05}}>
        {CONFIG.texts.lastDay.map((w, i) => {
          const start = CONFIG.wordBeats[i];
          const local = frame - start;
          if (local < 0) return <div key={i} style={{height: 0}} />;

          const color = C[w.color as ColorKey];
          const fontSize = w.word.length > 6 ? 180 : w.word.length <= 2 ? 120 : 240;

          // Corte seco: aparece cheio de uma vez com micro "punch" de escala
          if (w.hardCut) {
            const punch = interpolate(local, [0, 4], [1.15, 1], {extrapolateRight: 'clamp'});
            return (
              <div key={i} style={{fontSize, color, transform: `scale(${punch})`}}>
                {w.word}
              </div>
            );
          }

          // Fade + translateY
          const s = spring({frame: local, fps, config: {damping: 15, stiffness: 180}});
          const style: React.CSSProperties = {
            fontSize,
            opacity: s,
            transform: `translateY(${interpolate(s, [0, 1], [80, 0])}px)`,
          };
          return (
            <div key={i} style={style}>
              {w.glitch ? <GlitchWord text={w.word} color={color} localFrame={local} /> : <span style={{color}}>{w.word}</span>}
            </div>
          );
        })}
      </div>
    </Safe>
  );
};

// ============================================================
// CENA 3 — LOGO + CTA
// ============================================================
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {duration} = CONFIG.scenes.cta;

  const logoIn = spring({frame, fps, config: {damping: 12, stiffness: 140}});
  const logoScale = interpolate(logoIn, [0, 1], [0.6, 1]);
  const glowPulse = 0.7 + Math.sin(frame / 6) * 0.15;

  const ctaIn = spring({frame: frame - 10, fps, config: {damping: 14}});
  // Pulso 1 → 1,05 → 1 a cada ~0,6s
  const pulse = 1 + 0.05 * Math.max(0, Math.sin(((frame - 10) / 18) * Math.PI));

  const remaining = interpolate(frame, [0, duration], [1, 0], {extrapolateRight: 'clamp'});
  const entrance = interpolate(frame, [0, CONFIG.whipFrames], [500, 0], {extrapolateRight: 'clamp'});

  return (
    <Safe style={{transform: `translateX(${entrance}px)`, filter: `blur(${entrance / 25}px)`, gap: 70}}>
      <div style={{position: 'relative', opacity: logoIn, transform: `scale(${logoScale})`}}>
        <div
          style={{
            position: 'absolute',
            inset: '-30%',
            background: `radial-gradient(circle, ${C.yellow}88 0%, ${C.yellow}22 40%, transparent 70%)`,
            opacity: glowPulse,
            filter: 'blur(30px)',
          }}
        />
        <Img src={staticFile(CONFIG.logo)} style={{position: 'relative', width: 840, maxWidth: '100%', objectFit: 'contain'}} />
      </div>

      <div
        style={{
          opacity: ctaIn,
          transform: `translateY(${interpolate(ctaIn, [0, 1], [40, 0])}px) scale(${pulse})`,
          border: `8px solid ${C.yellow}`,
          padding: '28px 40px',
          color: C.white,
          fontSize: 92,
          lineHeight: 1.1,
          boxShadow: `0 0 40px ${C.yellow}55`,
          background: 'rgba(10,10,10,0.6)',
        }}
      >
        {CONFIG.texts.cta}
      </div>

      <div style={{width: '100%', opacity: ctaIn}}>
        <div style={{color: C.red, fontSize: 48, letterSpacing: 4, marginBottom: 16}}>● {CONFIG.texts.urgency}</div>
        <div style={{height: 18, background: '#2A2A2A', width: '100%'}}>
          <div
            style={{
              height: '100%',
              width: `${remaining * 100}%`,
              background: `linear-gradient(90deg, ${C.red}, ${C.yellow})`,
              boxShadow: `0 0 20px ${C.red}`,
            }}
          />
        </div>
      </div>
    </Safe>
  );
};

// ============================================================
// COMPOSIÇÃO PRINCIPAL
// ============================================================
export const WolverReelsAd: React.FC = () => {
  const {attention, lastDay, cta} = CONFIG.scenes;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <SpeedLines />
      <Particles />

      <Sequence from={attention.from} durationInFrames={attention.duration} name="Cena 1 - Atenção">
        <SceneAttention />
      </Sequence>
      <Sequence from={lastDay.from} durationInFrames={lastDay.duration} name="Cena 2 - Último dia">
        <SceneLastDay />
      </Sequence>
      <Sequence from={cta.from} durationInFrames={cta.duration} name="Cena 3 - Logo + CTA">
        <SceneCTA />
      </Sequence>

      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};
