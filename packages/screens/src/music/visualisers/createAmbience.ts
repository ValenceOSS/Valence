import type { Draw } from './Visualiser';

const ORBS = 7;

const GLOW_RINGS = 7;

/**
 * Soft orbs of colour drifting slowly across a dark screen, each swelling with the bass and glowing
 * brighter with the treble. Nothing sharp and nothing fast: what to have on in a room, rather than
 * to watch.
 *
 * @returns How to draw a frame.
 */
const createAmbience = (): Draw => {
  let swell = 0;

  return (painter, frame) => {
    const { width, height, seconds, delta, hue } = frame;

    painter.globalAlpha = 1;
    painter.globalCompositeOperation = 'source-over';
    painter.fillStyle = 'rgba(4, 4, 10, 0.22)';
    painter.fillRect(0, 0, width, height);

    swell += (frame.bass - swell) * Math.min(1, delta * 4);

    const reach = Math.min(width, height);

    painter.globalCompositeOperation = 'lighter';

    for (let orb = 0; orb < ORBS; orb += 1) {
      const x = width * (0.5 + 0.38 * Math.sin(seconds * (0.11 + orb * 0.037) + orb * 1.7));
      const y = height * (0.5 + 0.34 * Math.cos(seconds * (0.09 + orb * 0.041) + orb * 2.3));
      const size = reach * (0.14 + swell * 0.16 + (orb % 3) * 0.03);
      const colour = (hue + orb * 47 + seconds * 5) % 360;

      for (let ring = GLOW_RINGS; ring >= 1; ring -= 1) {
        painter.beginPath();
        painter.arc(x, y, size * (ring / GLOW_RINGS), 0, Math.PI * 2);
        painter.fillStyle = `hsla(${colour.toFixed(1)}, 85%, 55%, ${(0.05 + frame.treble * 0.05).toFixed(3)})`;
        painter.fill();
      }
    }

    painter.globalCompositeOperation = 'source-over';
  };
};

export { createAmbience };
