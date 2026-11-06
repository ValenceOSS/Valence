import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';

/**
 * Says whether a value holds nothing: no value, an empty list or no content ratings.
 *
 * @param value - The value.
 * @returns Whether it is empty.
 */
const isEmpty = (value: TitleValue): boolean =>
  value === null ||
  (Array.isArray(value)
    ? value.length === 0
    : typeof value === 'object' && Object.keys(value).length === 0);

/**
 * Says whether two values of a title's field say the same: lists word for word in order, a cast
 * person by person in order, and a map of content ratings by country whatever order its countries
 * came in, and nothing the same as an empty list.
 *
 * @param one - A value.
 * @param other - Another.
 * @returns Whether they say the same.
 */
const isSameTitleValue = (one: TitleValue, other: TitleValue): boolean => {
  if (isEmpty(one) && isEmpty(other)) {
    return true;
  }

  if (one === null || other === null || typeof one !== 'object' || typeof other !== 'object') {
    return one === other;
  }

  if (Array.isArray(one) || Array.isArray(other)) {
    return (
      Array.isArray(one) &&
      Array.isArray(other) &&
      one.length === other.length &&
      one.every((entry, at) => {
        const twin = other[at];

        return typeof entry === 'string' || typeof twin === 'string' || twin === undefined
          ? entry === twin
          : entry.personId === twin.personId &&
              entry.name === twin.name &&
              entry.role === twin.role &&
              entry.imageUrl === twin.imageUrl;
      })
    );
  }

  const keys = Object.keys(one);

  return (
    keys.length === Object.keys(other).length &&
    keys.every((key) => Object.hasOwn(other, key) && one[key] === other[key])
  );
};

export { isSameTitleValue };
