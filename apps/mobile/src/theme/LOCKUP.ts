const CAP_HEIGHT = 0.745;

const NAME_SIZE = 30;

const LOCKUP = {
  capHeight: CAP_HEIGHT,
  gapOfTheSize: 0.25,
  markHigh: NAME_SIZE * CAP_HEIGHT,
  nameSize: NAME_SIZE,
  tracking: -0.045,
} as const;

export { LOCKUP };
