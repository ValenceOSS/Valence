import type { Draw } from './Visualiser';

const STARS = 240;

const NEAREST = 0.02;

/**
 * A run of numbers that looks random and is the same every time, so a visualiser that begins with
 * the same stars begins the same way.
 *
 * @param seed - Where the run starts.
 * @returns The next number from nothing to one, each time it is called.
 */
const runOf = (seed: number): (() => number) => {
  let held = seed;

  return () => {
    held = (held * 1664525 + 1013904223) % 4294967296;

    return held / 4294967296;
  };
};

type Star = { angle: number; depth: number; hue: number };

/**
 * Stars flying out from the middle of the screen, faster the harder the bass hits, each leaving a
 * streak behind it — like being carried at speed through a field of them.
 *
 * @returns How to draw a frame.
 */
const createWarp = (): Draw => {
  const next = runOf(7);
  const stars: Star[] = Array.from({ length: STARS }, () => ({
    angle: next() * Math.PI * 2,
    depth: next(),
    hue: next() * 80,
  }));

  return (painter, frame) => {
    const { width, height, delta, hue } = frame;

    painter.globalAlpha = 1;
    painter.globalCompositeOperation = 'source-over';
    painter.fillStyle = 'rgba(2, 3, 8, 0.28)';
    painter.fillRect(0, 0, width, height);

    const speed = 0.12 + frame.bass * 1.1 + frame.mid * 0.4;
    const centreX = width / 2;
    const centreY = height / 2;
    const reach = Math.hypot(width, height) / 2;

    painter.lineCap = 'round';

    for (const star of stars) {
      const before = star.depth;

      star.depth -= speed * delta;

      if (star.depth <= NEAREST) {
        star.depth = 1;
        star.angle = next() * Math.PI * 2;
        star.hue = next() * 80;

        continue;
      }

      const from = (1 - before) ** 2.2 * reach;
      const to = (1 - star.depth) ** 2.2 * reach;

      painter.beginPath();
      painter.moveTo(centreX + Math.cos(star.angle) * from, centreY + Math.sin(star.angle) * from);
      painter.lineTo(centreX + Math.cos(star.angle) * to, centreY + Math.sin(star.angle) * to);
      painter.strokeStyle = `hsl(${((hue + star.hue) % 360).toFixed(1)}, 80%, ${(60 + (1 - star.depth) * 30).toFixed(1)}%)`;
      painter.lineWidth = 1 + (1 - star.depth) * 2.4;
      painter.stroke();
    }
  };
};

export { createWarp, runOf };
