const SPRINGS = {
  rise: { stiffness: 320, damping: 34, mass: 0.9 },
  heavy: { stiffness: 180, damping: 30, mass: 1.1 },
  liquid: { stiffness: 380, damping: 34, mass: 1 },
} as const;

export { SPRINGS };
