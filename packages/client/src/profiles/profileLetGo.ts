const listeners = new Set<() => void>();

const profileLetGo = {
  tell: (): void => {
    listeners.forEach((listener) => {
      listener();
    });
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export { profileLetGo };
