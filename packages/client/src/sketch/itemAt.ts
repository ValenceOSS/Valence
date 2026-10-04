import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';

/**
 * Which word or sticker is under a point, taking the topmost where several overlap, so pressing on
 * one picks it up to move. Strokes are never picked up: they are drawn, not placed.
 *
 * @param scene - The sketch.
 * @param x - Across, in the scene's own units.
 * @param y - Down, in the scene's own units.
 * @returns Where the item sits in the scene's list, or nothing where the point is on no item.
 */
const itemAt = (scene: SketchScene, x: number, y: number): number | null => {
  for (let at = scene.items.length - 1; at >= 0; at -= 1) {
    const item = scene.items[at];

    if (item !== undefined && item.kind !== 'stroke') {
      const halfWide =
        item.kind === 'text' ? (item.size * item.text.length * 0.6) / 2 : item.size / 2;
      const halfHigh = item.size / 2;
      const turn = (-item.turn * Math.PI) / 180;
      const dx = x - item.x;
      const dy = y - item.y;
      const across = dx * Math.cos(turn) - dy * Math.sin(turn);
      const down = dx * Math.sin(turn) + dy * Math.cos(turn);

      if (Math.abs(across) <= halfWide && Math.abs(down) <= halfHigh) {
        return at;
      }
    }
  }

  return null;
};

export { itemAt };
