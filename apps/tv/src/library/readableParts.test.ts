import { readableParts } from '@ValenceTv/library/readableParts';

describe('readableParts', () => {
  it('keeps short paragraphs as they are', () => {
    expect(readableParts('Born in Paris.\n\nTrained in Oxford.\n')).toEqual([
      'Born in Paris.',
      'Trained in Oxford.',
    ]);
  });

  it('breaks a long paragraph between its sentences, keeping every word', () => {
    const sentence = 'She acted in a great many films over a long and varied career. ';
    const paragraph = sentence.repeat(12).trim();
    const parts = readableParts(paragraph);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part.length <= 360 && part.endsWith('.'))).toBe(true);
    expect(parts.join(' ')).toBe(paragraph);
  });

  it('has nothing to read in nothing', () => {
    expect(readableParts('  \n\n ')).toEqual([]);
  });
});
