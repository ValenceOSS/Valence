/**
 * The bytes a data URL holds.
 *
 * @param dataUrl - A base64 data URL.
 * @returns Its bytes.
 */
const bytesOf = (dataUrl: string): Buffer =>
  Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

export { bytesOf };
