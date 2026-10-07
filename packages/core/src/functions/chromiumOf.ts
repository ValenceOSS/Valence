const CHROMIUM = /\bChr[o0]me\/(\d+)|\b(\d+)(?:\.\d+){3,4}\/[\d.]+ TV\b/;

/**
 * Which Chromium a browser is built on, from what it says it is. LG's own browser spells Chrome
 * with a zero, as "Chr0me/94", and Samsung's gives its Chromium's version without naming Chromium,
 * as "85.0.4183.93/6.5 TV", so both are read too.
 *
 * @param userAgent - What the browser says it is.
 * @returns The major version, or nothing where it names none.
 */
const chromiumOf = (userAgent: string): number | null => {
  const found = CHROMIUM.exec(userAgent);
  const version = found?.[1] ?? found?.[2];

  return version === undefined ? null : Number(version);
};

export { chromiumOf };
