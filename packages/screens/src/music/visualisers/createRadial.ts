import type { Draw } from './Visualiser';

const RAYS = 120;

/**
 * The spectrum bent into a ring: a ray for every part of the range, pointing out from a circle that
 * pulses with the bass, the whole thing turning slowly. Mirrored so the two halves match.
 *
 * @returns How to draw a frame.
 */
const createRadial = (): Draw => {
  let pulse = 0;

  return (painter, frame) => {
    const { width, height, seconds, delta, hue } = frame;

    painter.globalAlpha = 1;
    painter.globalCompositeOperation = 'source-over';
    painter.fillStyle = 'rgba(4, 5, 12, 0.3)';
    painter.fillRect(0, 0, width, height);

    pulse += (frame.bass - pulse) * Math.min(1, delta * 10);

    const half = RAYS / 2;
    const levels = frame.spectrum(half);
    const centreX = width / 2;
    const centreY = height / 2;
    const inner = Math.min(width, height) * (0.16 + pulse * 0.05);
    const longest = Math.min(width, height) * 0.3;

    painter.save();
    painter.translate(centreX, centreY);
    painter.rotate(seconds * 0.12);
    painter.lineCap = 'round';
    painter.lineWidth = Math.max(2, (Math.PI * 2 * inner) / RAYS / 1.6);

    for (let ray = 0; ray < RAYS; ray += 1) {
      const level = levels[ray < half ? ray : RAYS - 1 - ray] ?? 0;
      const angle = (ray / RAYS) * Math.PI * 2;
      const outer = inner + 4 + level * longest;

      painter.beginPath();
      painter.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      painter.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      painter.strokeStyle = `hsl(${((hue + (ray / RAYS) * 200 + seconds * 10) % 360).toFixed(1)}, 90%, ${(52 + level * 14).toFixed(1)}%)`;
      painter.stroke();
    }

    painter.beginPath();
    painter.arc(0, 0, inner * 0.94, 0, Math.PI * 2);
    painter.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    painter.lineWidth = 2;
    painter.stroke();
    painter.restore();
  };
};

export { createRadial };
