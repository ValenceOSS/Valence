type ALeap = {
  way: 'back' | 'forward';
  seconds: number;
  count: number;
};

type TheLeapProps = {
  leap: ALeap;
};

export type { ALeap, TheLeapProps };
