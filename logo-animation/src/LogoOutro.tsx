import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const BLUE = '#1e9be0';
const LOGO_W = 900;
const LOGO_H = 875;
const CX = 540;
const CY = 960;

const STRIKE = 4; // bolt starts
const HIT = 10; // bolt hits centre, logo is born
const PEAK = 40; // logo at max size, fully visible
const SETTLE = 62; // back to original size

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Jagged lightning path from the top of the frame down to the logo centre
const boltPath = (seed: string, x0: number, segments: number) => {
  let x = x0;
  const pts: string[] = [`M ${x} -50`];
  for (let i = 1; i <= segments; i++) {
    const y = -50 + ((CY + 50) * i) / segments;
    const pull = (CX - x) * (i / segments);
    x += pull * 0.5 + (random(`${seed}-${i}`) - 0.5) * 160;
    if (i === segments) x = CX;
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
};

const Lightning: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < STRIKE || frame > HIT + 10) return null;
  // Bolt draws down until HIT, then flickers and dies
  const draw = interpolate(frame, [STRIKE, HIT], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const flicker = frame > HIT ? (random(`f${frame}`) > 0.4 ? 1 : 0.2) * interpolate(frame, [HIT, HIT + 10], [1, 0], clamp) : 1;
  // Re-seed every 2 frames so the bolt crackles
  const seed = `b${Math.floor(frame / 2)}`;
  const main = boltPath(seed, 380, 14);
  const branch = boltPath(`${seed}x`, 760, 9);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', opacity: flicker}}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[main, branch].map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          fill="none"
          stroke={i ? '#9fdcff' : '#fff'}
          strokeWidth={i ? 5 : 10}
          strokeLinejoin="miter"
          filter="url(#glow)"
          style={{opacity: i ? 0.7 : 1}}
        />
      ))}
    </svg>
  );
};

const Shockwave: React.FC<{at: number; strength: number}> = ({at, strength}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 30) return null;
  const size = interpolate(t, [0, 30], [100, 2000 * strength], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `${interpolate(t, [0, 30], [26 * strength, 2], clamp)}px solid ${BLUE}`,
          boxShadow: `0 0 80px ${BLUE}, inset 0 0 60px ${BLUE}`,
          opacity: interpolate(t, [0, 30], [0.9, 0], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

const Sparks: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 45) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      {new Array(50).fill(0).map((_, i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const dist = (250 + random(`d${i}`) * 750) * Easing.out(Easing.quad)(Math.min(t / 45, 1));
        const len = 4 + random(`w${i}`) * 18;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: len,
              height: 4,
              borderRadius: 2,
              background: i % 3 ? '#fff' : BLUE,
              boxShadow: `0 0 12px ${BLUE}`,
              transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${angle}rad)`,
              opacity: interpolate(t, [0, 45], [1, 0], clamp),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const LogoOutro: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo: born from the strike, grows while fading in, then eases back to original size
  const scale = interpolate(frame, [HIT, PEAK, SETTLE], [0.3, 1.18, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const opacity = interpolate(frame, [HIT, PEAK], [0, 1], clamp);
  const glow = interpolate(frame, [HIT, PEAK, SETTLE, 150], [120, 70, 35, 45], clamp);
  const brightness = interpolate(frame, [HIT, HIT + 12, PEAK], [3, 1.6, 1], clamp);

  // Camera shake on strike and on settle
  const shake = (at: number, amt: number, axis: string) => {
    const t = frame - at;
    if (t < 0 || t > 12) return 0;
    return (random(`sh${axis}${frame}`) - 0.5) * amt * (1 - t / 12);
  };
  const sx = shake(HIT, 46, 'x') + shake(SETTLE, 16, 'x');
  const sy = shake(HIT, 46, 'y') + shake(SETTLE, 16, 'y');

  const flash = interpolate(frame, [HIT - 1, HIT, HIT + 3, HIT + 10], [0, 0.95, 0.5, 0], clamp);
  const bg = interpolate(frame, [HIT, PEAK], [0, 0.35], clamp);
  const shineX = interpolate(frame, [SETTLE + 8, SETTLE + 32], [-500, 1200], {...clamp, easing: Easing.inOut(Easing.quad)});
  const exit = interpolate(frame, [138, 150], [1, 0], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <Audio src={staticFile('impact.wav')} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(30,155,224,${bg}) 0%, rgba(0,0,0,0) 55%)`,
          opacity: exit,
        }}
      />
      <Lightning />
      <Shockwave at={HIT} strength={1} />
      <Shockwave at={SETTLE} strength={0.6} />
      <Sparks at={HIT} />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: exit,
          transform: `translate(${sx}px, ${sy}px)`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: LOGO_W,
            height: LOGO_H,
            opacity,
            transform: `scale(${scale})`,
            filter: `brightness(${brightness}) drop-shadow(0 0 ${glow}px rgba(30,155,224,0.6))`,
          }}
        >
          <Img src={staticFile('logo.png')} style={{width: LOGO_W, height: LOGO_H}} />
          {/* Shine sweep, masked to the logo */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              WebkitMaskImage: `url(${staticFile('logo.png')})`,
              WebkitMaskSize: '100% 100%',
              maskImage: `url(${staticFile('logo.png')})`,
              maskSize: '100% 100%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -200,
                left: shineX,
                width: 160,
                height: LOGO_H + 400,
                transform: 'rotate(20deg)',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              }}
            />
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{backgroundColor: '#dff3ff', opacity: flash}} />
    </AbsoluteFill>
  );
};
