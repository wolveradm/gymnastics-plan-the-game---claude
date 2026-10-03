# Synthesizes the outro sound: riser -> thunder crack + sub boom -> rumble -> settle hit.
import math, random, struct, wave

SR, DUR = 44100, 5.0
N = int(SR * DUR)
random.seed(7)
L = [0.0] * N
R = [0.0] * N

def add(i, v, pan=0.0):
    if 0 <= i < N:
        L[i] += v * (1 - pan); R[i] += v * (1 + pan)

HIT = int(SR * 10 / 30)      # lightning strike (frame 10)
SETTLE = int(SR * 62 / 30)   # logo settles to original size

# Whoosh riser before the strike (filtered noise, rising cutoff)
lp = 0.0
for i in range(HIT):
    t = i / HIT
    a = 0.02 + 0.5 * t ** 2
    lp += a * (random.uniform(-1, 1) - lp)
    add(i, lp * 0.6 * t ** 1.5, math.sin(t * 9) * 0.3)

# Thunder crack: bright noise burst with crackles
hp_prev = x_prev = 0.0
for k in range(int(SR * 0.45)):
    t = k / SR
    x = random.uniform(-1, 1) * (1 if random.random() > 0.15 else 3)
    hp = 0.9 * (hp_prev + x - x_prev); hp_prev, x_prev = hp, x
    add(HIT + k, hp * 0.9 * math.exp(-t * 11), random.uniform(-0.4, 0.4))

# Sub boom with pitch drop
ph = 0.0
for k in range(int(SR * 2.2)):
    t = k / SR
    f = 38 + 90 * math.exp(-t * 9)
    ph += 2 * math.pi * f / SR
    v = math.sin(ph) * math.exp(-t * 2.2)
    add(HIT + k, math.tanh(v * 2.5) * 0.85)

# Rolling thunder rumble (low-passed noise with slow modulation)
lp = 0.0
for k in range(int(SR * 3.5)):
    t = k / SR
    lp += 0.012 * (random.uniform(-1, 1) - lp)
    mod = 0.6 + 0.4 * math.sin(t * 7 + math.sin(t * 3) * 2)
    add(HIT + int(SR * 0.05) + k, lp * 9 * mod * math.exp(-t * 1.1), math.sin(t * 2) * 0.3)

# Settle hit: short punchy kick + metallic ping
ph = 0.0
for k in range(int(SR * 1.2)):
    t = k / SR
    ph += 2 * math.pi * (45 + 120 * math.exp(-t * 25)) / SR
    add(SETTLE + k, math.tanh(math.sin(ph) * 3) * 0.55 * math.exp(-t * 4))
    add(SETTLE + k, math.sin(2 * math.pi * 1320 * t) * 0.08 * math.exp(-t * 6))

# Fade out at the end, normalize, soft clip
for i in range(N):
    g = min(1.0, (N - i) / (SR * 0.4))
    L[i] *= g; R[i] *= g
peak = max(max(abs(v) for v in L), max(abs(v) for v in R))
with wave.open('public/impact.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<hh',
        int(math.tanh(L[i] / peak * 1.2) * 30000),
        int(math.tanh(R[i] / peak * 1.2) * 30000)) for i in range(N)))
