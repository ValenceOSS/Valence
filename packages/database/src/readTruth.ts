/**
 * Reads a yes-or-no a database handed back, which Postgres writes as a boolean and MySQL as the
 * number 1 or 0 — sometimes as text.
 *
 * @param value - What the database returned.
 * @returns Whether it means yes.
 */
const readTruth = (value: boolean | number | string | null): boolean =>
  value === true || value === 1 || value === '1' || value === 't' || value === 'true';

export { readTruth };
