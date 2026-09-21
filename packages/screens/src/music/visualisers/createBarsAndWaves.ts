import type { Draw } from './Visualiser';

const BARS = 64;

const PEAK_FALLS_PER_SECOND = 0.35;

const WAVE_POINTS = 192;

/**
 * Bars rising from the floor with the sound, a cap on each that hangs at the highest it reached and
 * then falls, and the wave of the sound drawn across them in white — the way a spectrum is drawn on
 * an amplifier. Each frame is drawn over a dimmed copy of the last, so movement leaves a trail.
 *
 * @returns How to draw a frame.
 */
const createBarsAndWaves = (): Draw => {
  const peaks = Array.from({ length: BARS }, () => 0);

  return (painter, frame) => {
    const { width, height, seconds, delta, hue } = frame;

    painter.globalAlpha = 1;
    painter.globalCompositeOperation = 'source-over';
    painter.fillStyle = 'rgba(5, 7, 14, 0.4)';
    painter.fillRect(0, 0, width, height);

    const bars = frame.spectrum(BARS);
    const slot = width / BARS;
    const thickness = slot * 0.72;
    const floor = height * 0.82;
    const reach = height * 0.62;

    bars.forEach((level, bar) => {
      const tall = level * reach;
      const x = bar * slot + (slot - thickness) / 2;

      peaks[bar] = Math.max((peaks[bar] ?? 0) - PEAK_FALLS_PER_SECOND * delta, level);

      painter.fillStyle = `hsl(${((hue + bar * 3.2 + seconds * 12) % 360).toFixed(1)}, 90%, ${(48 + level * 16).toFixed(1)}%)`;
      painter.fillRect(x, floor - tall, thickness, tall);

      painter.fillStyle = 'rgba(255, 255, 255, 0.85)';
      painter.fillRect(x, floor - (peaks[bar] ?? 0) * reach - 5, thickness, 3);
    });

    const wave = frame.wave(WAVE_POINTS);

    painter.beginPath();
    wave.forEach((sample, point) => {
      const x = (point / (WAVE_POINTS - 1)) * width;
      const y = height * 0.5 + sample * height * 0.2;

      if (point === 0) {
        painter.moveTo(x, y);
      } else {
        painter.lineTo(x, y);
      }
    });
    painter.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    painter.lineWidth = 2;
    painter.lineJoin = 'round';
    painter.stroke();
  };
};

export { createBarsAndWaves };
