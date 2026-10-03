import React from 'react';
import {Composition} from 'remotion';
import {LogoOutro} from './LogoOutro';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="LogoOutro"
    component={LogoOutro}
    durationInFrames={150}
    fps={30}
    width={1080}
    height={1920}
  />
);
