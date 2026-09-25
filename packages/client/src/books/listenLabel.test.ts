import { describe, expect, it } from 'vitest';
import { listenLabel } from '@ValenceClient/books/listenLabel';

const PLACE = {
  bookId: 'book-1',
  chapterId: 'chapter-1',
  positionSeconds: 120,
  isFinished: false,
  updatedAt: '2026-09-24T00:00:00.000Z',
};

describe('listenLabel', () => {
  it('asks to listen to a book nobody has started', () => {
    expect(listenLabel(null)).toBe('Listen');
    expect(listenLabel(undefined)).toBe('Listen');
  });

  it('carries on with a book somebody is partway through', () => {
    expect(listenLabel(PLACE)).toBe('Continue listening');
  });

  it('hears a finished book again', () => {
    expect(listenLabel({ ...PLACE, isFinished: true })).toBe('Listen again');
  });
});
