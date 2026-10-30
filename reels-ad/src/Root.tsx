import {Composition} from 'remotion';
import {CONFIG, WolverReelsAd} from './WolverReelsAd';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="WolverReelsAd"
    component={WolverReelsAd}
    durationInFrames={CONFIG.video.durationInFrames}
    fps={CONFIG.video.fps}
    width={CONFIG.video.width}
    height={CONFIG.video.height}
  />
);
