/**
 * The bytes a hexadecimal string spells.
 *
 * @param hex - The string, two digits a byte.
 * @returns The bytes.
 */
const bytesOf = (hex: string): Uint8Array =>
  Uint8Array.from(hex.match(/../gu) ?? [], (pair) => Number.parseInt(pair, 16));

export { bytesOf };
