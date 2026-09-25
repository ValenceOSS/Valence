/**
 * What to call this television in the sessions list an operator reads.
 *
 * The name somebody gave the box in its settings is the one they will recognise — "Living Room" —
 * and the kind of box stands in where it has none.
 *
 * @param deviceName - What the television calls itself, where the system will say.
 * @returns The television as a person would describe it.
 */
const describeThisTv = (deviceName: string | null): string =>
  // eslint-disable-next-line valence/no-hard-coded-strings -- the product's own name, as the box names itself
  deviceName !== null && deviceName.trim() !== '' ? deviceName.trim() : 'Apple TV';

export { describeThisTv };
