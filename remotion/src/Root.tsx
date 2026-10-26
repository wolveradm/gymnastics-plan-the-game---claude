import { Composition } from 'remotion';
import { CONFIG, WolverReels } from './WolverReels';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="WolverReels"
    component={WolverReels}
    width={CONFIG.width}
    height={CONFIG.height}
    fps={CONFIG.fps}
    durationInFrames={CONFIG.durationInFrames}
  />
);
