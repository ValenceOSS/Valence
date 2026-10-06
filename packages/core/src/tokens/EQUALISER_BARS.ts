const EQUALISER_BARS = [
  { rests: 0.45, heights: [0.35, 1, 0.55, 0.85, 0.35], milliseconds: 900 },
  { rests: 0.8, heights: [0.8, 0.4, 1, 0.5, 0.8], milliseconds: 1100 },
  { rests: 0.6, heights: [0.55, 0.9, 0.3, 1, 0.55], milliseconds: 800 },
  { rests: 0.35, heights: [0.3, 0.7, 0.95, 0.45, 0.3], milliseconds: 1300 },
] as const;

export { EQUALISER_BARS };
