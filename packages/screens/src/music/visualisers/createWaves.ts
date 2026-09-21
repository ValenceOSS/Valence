import type { Draw } from './Visualiser';

const POINTS = 220;

const LINES = 5;

/**
 * Several glowing lines of the sound's wave laid over one another, each a little off in colour, in
 * height and in time, added together so where they cross they burn brighter. Loud passages make
 * them swing wide; silence lets them settle to a single quiet line.
 *
 * @returns How to draw a frame.
 */
const createWaves = (): Draw => {
  let swing = 0.2;

  return (painter, frame) => {
    const { width, height, seconds, delta, hue } = frame;

    painter.globalAlpha = 1;
    painter.globalCompositeOperation = 'source-over';
    painter.shadowBlur = 0;
    painter.fillStyle = 'rgba(3, 4, 10, 0.32)';
    painter.fillRect(0, 0, width, height);

    swing += (0.2 + (frame.bass + frame.mid) * 0.9 - swing) * Math.min(1, delta * 6);

    const wave = frame.wave(POINTS);

    painter.globalCompositeOperation = 'lighter';
    painter.lineWidth = 2.5;
    painter.lineCap = 'round';
    painter.lineJoin = 'round';

    for (let line = 0; line < LINES; line += 1) {
      const offset = line - (LINES - 1) / 2;

      painter.beginPath();
      wave.forEach((sample, point) => {
        const along = point / (POINTS - 1);
        const x = along * width;
        const ripple = Math.sin(along * 9 + seconds * (0.8 + line * 0.25) + line) * 0.06;
        const y = height * 0.5 + (sample * swing + ripple * swing) * height * 0.42 + offset * 14;

        if (point === 0) {
          painter.moveTo(x, y);
        } else {
          painter.lineTo(x, y);
        }
      });
      painter.shadowColor = `hsl(${((hue + line * 28) % 360).toFixed(1)}, 100%, 60%)`;
      painter.shadowBlur = 18;
      painter.strokeStyle = `hsla(${((hue + line * 28) % 360).toFixed(1)}, 95%, 62%, 0.55)`;
      painter.stroke();
    }

    painter.globalCompositeOperation = 'source-over';
    painter.shadowBlur = 0;
  };
};

export { createWaves };
