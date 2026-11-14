import type { TasteVector } from './TasteVector';

/**
 * Multiplies two sparse vectors feature by feature and adds the products, looking through the
 * smaller of them.
 *
 * @param left - One vector.
 * @param right - The other.
 * @returns Their dot product, the cosine of the angle between them where both are of unit length.
 */
const dotOf = (left: TasteVector, right: TasteVector): number => {
  const [fewer, more] = left.size <= right.size ? [left, right] : [right, left];
  let sum = 0;

  for (const [feature, weight] of fewer) {
    sum += weight * (more.get(feature) ?? 0);
  }

  return sum;
};

export { dotOf };
