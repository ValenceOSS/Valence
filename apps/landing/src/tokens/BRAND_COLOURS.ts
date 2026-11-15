const BRAND_COLOURS = {
  blue: {
    name: 'Valence Blue',
    hex: '#0066FF',
    mark: '#FFFFFF',
    use: 'The brand: the mark, buttons and highlights',
  },
  ink: {
    name: 'Ink',
    hex: '#161616',
    mark: '#EEEAE3',
    use: 'Text and the mark on light grounds',
  },
  black: {
    name: 'Black',
    hex: '#0A0A0A',
    mark: '#0066FF',
    use: 'Dark grounds, with the mark in blue',
  },
  paper: {
    name: 'Paper',
    hex: '#EEEAE3',
    mark: '#161616',
    use: 'Light grounds, print and posters',
  },
  white: {
    name: 'White',
    hex: '#FFFFFF',
    mark: '#0066FF',
    use: 'The mark and text on blue and dark grounds',
  },
  dev: {
    name: 'Dev orange',
    hex: '#FF4D2E',
    mark: '#FFFFFF',
    use: 'Development servers only, never the brand',
  },
} as const;

export { BRAND_COLOURS };
