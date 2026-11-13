const MEGABYTE = 1024 * 1024;

const PICTURE_LIMITS = {
  face: { mostBytes: 6 * MEGABYTE, mostPixelsAnEdge: 4096 },
  artwork: { mostBytes: 10 * MEGABYTE, mostPixelsAnEdge: 4096 },
  splashscreen: { mostBytes: 16 * MEGABYTE, mostPixelsAnEdge: 8192 },
  brandLogo: { mostBytes: 2 * MEGABYTE, mostPixelsAnEdge: 2048 },
} as const;

export { PICTURE_LIMITS };
