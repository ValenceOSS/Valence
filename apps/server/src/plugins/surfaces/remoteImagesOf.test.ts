import { describe, expect, it } from 'vitest';
import { remoteImagesOf } from './remoteImagesOf';

describe('remoteImagesOf', () => {
  it('finds the remote pictures in blocks, sections and rows, once each', () => {
    expect(
      remoteImagesOf({
        blocks: [
          { type: 'image', image: { kind: 'remote', url: 'https://example.com/a.png' }, alt: 'A' },
          { type: 'image', image: { kind: 'asset', name: 'b.png' }, alt: 'B' },
          {
            type: 'row',
            label: 'Alone',
            image: { kind: 'remote', url: 'https://example.com/d.png' },
          },
          {
            type: 'section',
            children: [
              {
                type: 'list',
                rows: [
                  {
                    type: 'row',
                    label: 'Row',
                    image: { kind: 'remote', url: 'https://example.com/c.png' },
                  },
                  { type: 'row', label: 'Bare' },
                ],
              },
              {
                type: 'image',
                image: { kind: 'remote', url: 'https://example.com/a.png' },
                alt: 'Again',
              },
            ],
          },
        ],
      }),
    ).toEqual([
      'https://example.com/a.png',
      'https://example.com/d.png',
      'https://example.com/c.png',
    ]);
  });
});
