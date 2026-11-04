import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';

/**
 * Says whether two values of a title's field say the same: lists word for word in order, and a
 * map of content ratings by country whatever order its countries came in.
 *
 * @param one - A value.
 * @param other - Another.
 * @returns Whether they say the same.
 */
const isSameTitleValue = (one: TitleValue, other: TitleValue): boolean => {
  if (one === null || other === null || typeof one !== 'object' || typeof other !== 'object') {
    return one === other;
  }

  if (Array.isArray(one) || Array.isArray(other)) {
    return (
      Array.isArray(one) &&
      Array.isArray(other) &&
      one.length === other.length &&
      one.every((word, at) => word === other[at])
    );
  }

  const keys = Object.keys(one);

  return (
    keys.length === Object.keys(other).length &&
    keys.every((key) => Object.hasOwn(other, key) && one[key] === other[key])
  );
};

export { isSameTitleValue };
