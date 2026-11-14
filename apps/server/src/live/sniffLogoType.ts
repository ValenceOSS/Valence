const startsWith = (bytes: Uint8Array, signature: readonly number[], from = 0): boolean =>
  signature.every((value, at) => bytes[from + at] === value);

/**
 * The picture type a run of bytes begins as, for a logo a host sent without saying what it is.
 *
 * @param bytes - The first bytes of the logo.
 * @returns Its media type, or null when it begins as no picture a channel logo may be.
 */
const sniffLogoType = (bytes: Uint8Array): string | null => {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) {
    return 'image/gif';
  }

  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }

  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00])) {
    return 'image/x-icon';
  }

  const text = new TextDecoder().decode(bytes.subarray(0, 512)).replace(/^﻿/u, '').trimStart();

  if (text.startsWith('<svg') || (text.startsWith('<?xml') && text.includes('<svg'))) {
    return 'image/svg+xml';
  }

  return null;
};

export { sniffLogoType };
