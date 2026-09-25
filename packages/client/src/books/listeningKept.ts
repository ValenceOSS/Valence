const listeners = new Set<(bookId: string) => void>();

const listeningKept = {
  tell: (bookId: string): void => {
    listeners.forEach((listener) => {
      listener(bookId);
    });
  },
  subscribe: (listener: (bookId: string) => void): (() => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export { listeningKept };
