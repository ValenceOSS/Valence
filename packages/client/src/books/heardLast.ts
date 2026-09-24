type Heard = 'music' | 'book';

const listeners = new Set<() => void>();

let last: Heard | null = null;

const heardLast = {
  read: (): Heard | null => last,
  hear: (heard: Heard): void => {
    if (last !== heard) {
      last = heard;
      listeners.forEach((listener) => {
        listener();
      });
    }
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  forget: (): void => {
    last = null;
  },
};

export type { Heard };

export { heardLast };
