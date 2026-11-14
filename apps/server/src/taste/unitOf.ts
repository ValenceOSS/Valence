import type { TasteVector } from './TasteVector';

/**
 * Scales a sparse vector to unit length, leaving an empty or all-zero one empty.
 *
 * @param vector - The vector.
 * @returns The same direction at length one.
 */
const unitOf = (vector: TasteVector): TasteVector => {
  let squares = 0;

  for (const weight of vector.values()) {
    squares += weight * weight;
  }

  if (squares === 0) {
    return new Map();
  }

  const length = Math.sqrt(squares);

  return new Map([...vector].map(([feature, weight]) => [feature, weight / length]));
};

export { unitOf };
