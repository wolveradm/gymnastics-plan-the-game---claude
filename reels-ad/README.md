# Wolver Games — Anúncio Reels/Stories (Remotion)

1080x1920 · 30 fps · 6 s (180 frames).

- Toda a configuração (cores, durações, textos, batidas das palavras, logo) fica no objeto `CONFIG` no topo de `src/WolverReelsAd.tsx`.
- Logo: `public/logo-wolver-games.svg`. Fonte Anton embutida em `public/fonts/` (não depende de internet).
- Vídeo final: `../video/wolver-reels-ad.mp4`. Se o render der timeout, use `--concurrency=2 --timeout=120000`.

```bash
npm install
npm start        # Remotion Studio (preview)
npm run render   # out/wolver-reels-ad.mp4 (H.264)
```
