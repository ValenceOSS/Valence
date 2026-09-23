import { describe, expect, it } from 'vitest';
import { marksFromProbe } from '@ValenceServer/books/marksFromProbe';

describe('marksFromProbe', () => {
  it('puts the chapters in order, named, and within the book', () => {
    expect(
      marksFromProbe(
        [
          { title: '002', startSeconds: 1181.1, endSeconds: 2672.5 },
          { title: '001', startSeconds: 0, endSeconds: 1181.1 },
          { title: 'Epilogue', startSeconds: 2672.5, endSeconds: 9000 },
        ],
        3000,
      ),
    ).toEqual([
      { title: 'Chapter 1', startSeconds: 0, endSeconds: 1181.1 },
      { title: 'Chapter 2', startSeconds: 1181.1, endSeconds: 2672.5 },
      { title: 'Epilogue', startSeconds: 2672.5, endSeconds: 3000 },
    ]);
  });
});
