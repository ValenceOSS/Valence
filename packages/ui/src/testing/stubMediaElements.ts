if (typeof HTMLMediaElement !== 'undefined') {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: () => Promise.resolve(),
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: () => undefined,
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', {
    configurable: true,
    writable: true,
    value: Object.assign([], {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}
