import type { CSSProperties } from 'react';

/**
 * Where the picture sits in the player, as `object-fit: contain` puts it: centred, and as large as
 * it can be at its own shape, so that the bars above and below or at the sides are left out.
 *
 * The box is measured in the player's container units, so the player must be a size container,
 * and it is one itself, so that a sign placed and sized as a fraction of the picture lands on the
 * picture rather than on the whole player.
 *
 * @param ratio - The picture's width over its height, or nothing where it is not known yet, which
 *   takes the whole player.
 * @returns The box's place and size.
 */
const pictureBox = (ratio: number | null): CSSProperties =>
  ratio === null
    ? { inset: 0 }
    : {
        left: '50%',
        top: '50%',
        width: `min(100cqw, calc(100cqh * ${ratio.toString()}))`,
        height: `min(100cqh, calc(100cqw / ${ratio.toString()}))`,
        transform: 'translate(-50%, -50%)',
      };

export { pictureBox };
