import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const BLUE = '#1e9be0';
const LOGO_W = 900;
const LOGO_H = 875; // 720x700 source scaled
const WOLF_SPLIT = 0.65; // fraction of height where wordmark starts

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Diagonal speed streaks rushing across the frame
const SpeedLines: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{transform: 'rotate(-20deg) scale(1.6)'}}>
      {new Array(26).fill(0).map((_, i) => {
        const y = random(`y${i}`) * 1920;
        const speed = 60 + random(`s${i}`) * 80;
        const len = 200 + random(`l${i}`) * 500;
        const x = ((frame * speed + random(`x${i}`) * 3000) % 3000) - 1000;
        const opacity = interpolate(frame, [0, 10, 40, 60], [0, 0.7, 0.35, 0.12], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: len,
              height: 2 + random(`h${i}`) * 4,
              background: `linear-gradient(90deg, transparent, ${i % 3 ? '#fff' : BLUE})`,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Shockwave ring on impact
const Shockwave: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const size = interpolate(t, [0, 25], [100, 1800], {...clamp, easing: Easing.out(Easing.cubic)});
  const opacity = interpolate(t, [0, 25], [0.9, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `${interpolate(t, [0, 25], [30, 2], clamp)}px solid ${BLUE}`,
          boxShadow: `0 0 80px ${BLUE}`,
          opacity,
          marginTop: -160,
        }}
      />
    </AbsoluteFill>
  );
};

// Sparks flying out on impact
const Sparks: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      {new Array(40).fill(0).map((_, i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const dist = (300 + random(`d${i}`) * 700) * Easing.out(Easing.quad)(Math.min(t / 35, 1));
        const opacity = interpolate(t, [0, 35], [1, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 4,
              background: i % 2 ? '#fff' : BLUE,
              boxShadow: `0 0 12px ${BLUE}`,
              transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 160}px)`,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const LogoPart: React.FC<{clip: string; style: React.CSSProperties}> = ({clip, style}) => (
  <Img
    src={staticFile('logo.png')}
    style={{
      position: 'absolute',
      width: LOGO_W,
      height: LOGO_H,
      clipPath: clip,
      ...style,
    }}
  />
);

export const LogoOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const IMPACT = 14; // wolf lands
  const TEXT_IN = 28; // wordmark slams

  // Wolf: zooms in from huge & blurred, slams down
  const wolfP = spring({frame, fps, config: {damping: 11, stiffness: 160}, durationInFrames: IMPACT + 10});
  const wolfScale = interpolate(wolfP, [0, 1], [3.2, 1]);
  const wolfBlur = interpolate(frame, [0, IMPACT], [20, 0], clamp);
  const wolfOpacity = interpolate(frame, [0, 6], [0, 1], clamp);

  // Wordmark: slides in from below with skew
  const textP = spring({frame: frame - TEXT_IN, fps, config: {damping: 13, stiffness: 200}});
  const textY = interpolate(textP, [0, 1], [260, 0]);
  const textSkew = interpolate(textP, [0, 1], [-25, 0]);
  const textOpacity = interpolate(frame, [TEXT_IN, TEXT_IN + 4], [0, 1], clamp);

  // Camera shake on impacts
  const shake = (at: number, amt: number, axis: string) => {
    const t = frame - at;
    if (t < 0 || t > 10) return 0;
    return (random(`sh${axis}${frame}${at}`) - 0.5) * amt * (1 - t / 10);
  };
  const sx = shake(IMPACT, 40, 'x') + shake(TEXT_IN + 4, 22, 'x');
  const sy = shake(IMPACT, 40, 'y') + shake(TEXT_IN + 4, 22, 'y');

  // White flash on impact
  const flash = interpolate(frame, [IMPACT, IMPACT + 2, IMPACT + 8], [0, 0.85, 0], clamp);

  // Slow push-in + subtle heartbeat pulse for the hold
  const push = interpolate(frame, [IMPACT, 150], [1, 1.07], clamp);
  const pulse = 1 + Math.max(0, Math.sin(((frame - 60) / 30) * Math.PI * 2)) * 0.012 * (frame > 60 ? 1 : 0);

  // RGB glitch bursts
  const glitchOn = (frame >= IMPACT && frame < IMPACT + 4) || (frame >= 95 && frame < 99);
  const gx = glitchOn ? (random(`g${frame}`) - 0.5) * 30 : 0;

  // Shine sweep across the logo
  const shineX = interpolate(frame, [55, 80], [-600, 1300], {...clamp, easing: Easing.inOut(Easing.quad)});

  // Glow
  const glow = interpolate(frame, [IMPACT, IMPACT + 10, 60], [80, 30, 40], clamp);

  // Exit: quick fade to black in the last frames
  const exit = interpolate(frame, [138, 150], [1, 0], clamp);

  const wolfClip = `inset(0 0 ${(1 - WOLF_SPLIT) * 100}% 0)`;
  const textClip = `inset(${WOLF_SPLIT * 100}% 0 0 0)`;

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      {/* Background radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(30,155,224,${interpolate(frame, [IMPACT, 40], [0, 0.35], clamp)}) 0%, rgba(0,0,0,0) 55%)`,
        }}
      />
      <SpeedLines />
      <Shockwave at={IMPACT} />
      <Shockwave at={TEXT_IN + 4} />
      <Sparks at={IMPACT} />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: exit,
          transform: `translate(${sx}px, ${sy}px) scale(${push * pulse})`,
        }}
      >
        <div style={{position: 'relative', width: LOGO_W, height: LOGO_H, filter: `drop-shadow(0 0 ${glow}px rgba(30,155,224,0.55))`}}>
          {/* Glitch channels */}
          {glitchOn && (
            <>
              <LogoPart clip={wolfClip} style={{transform: `translateX(${gx}px)`, opacity: 0.6, filter: 'hue-rotate(160deg)'}} />
              <LogoPart clip={wolfClip} style={{transform: `translateX(${-gx}px)`, opacity: 0.6, filter: 'hue-rotate(-60deg)'}} />
            </>
          )}
          <LogoPart
            clip={wolfClip}
            style={{
              opacity: wolfOpacity,
              transform: `scale(${wolfScale})`,
              transformOrigin: '50% 35%',
              filter: `blur(${wolfBlur}px)`,
            }}
          />
          <LogoPart
            clip={textClip}
            style={{
              opacity: textOpacity,
              transform: `translateY(${textY}px) skewX(${textSkew}deg)`,
            }}
          />
          {/* Shine sweep */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              WebkitMaskImage: `url(${staticFile('logo.png')})`,
              WebkitMaskSize: '100% 100%',
              maskImage: `url(${staticFile('logo.png')})`,
              maskSize: '100% 100%',
              overflow: 'hidden',
              mixBlendMode: 'screen',
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
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
              }}
            />
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
