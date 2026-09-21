import { describe, expect, it } from 'vitest';
import {
  failureOfAnswer,
  failureOfMissing,
  failureOfRefusal,
  failureOfSent,
  failureOfThrown,
} from './failureOf';

describe('failureOfAnswer', () => {
  it('is nothing where it worked, and says something where it did not', () => {
    expect(failureOfAnswer(true)).toBeNull();
    expect(failureOfAnswer(false)).toBe('That could not be done.');
    expect(failureOfAnswer(false, 'No such stream.')).toBe('No such stream.');
  });
});

describe('failureOfRefusal', () => {
  it('is nothing where nothing was refused, and the reason where it was', () => {
    expect(failureOfRefusal(null)).toBeNull();
    expect(failureOfRefusal({ message: 'A role needs a name.' })).toBe('A role needs a name.');
  });
});

describe('failureOfMissing', () => {
  it('is nothing where something was made, and says something where nothing was', () => {
    expect(failureOfMissing({ id: 1 })).toBeNull();
    expect(failureOfMissing(null)).toBe('That could not be done.');
    expect(failureOfMissing(null, 'It would not start.')).toBe('It would not start.');
  });
});

describe('failureOfSent', () => {
  it('prefers the reason it was refused', () => {
    expect(failureOfSent({ value: null, refusal: { message: 'Not allowed.' } })).toBe(
      'Not allowed.',
    );
  });

  it('is nothing where something came back', () => {
    expect(failureOfSent({ value: { id: 1 }, refusal: null })).toBeNull();
  });

  it('says something where neither came back', () => {
    expect(failureOfSent({ value: null, refusal: null }, 'Nothing came back.')).toBe(
      'Nothing came back.',
    );
  });
});

describe('failureOfThrown', () => {
  it('is nothing where it ran', async () => {
    expect(await failureOfThrown(() => Promise.resolve('ok'))).toBeNull();
  });

  it('is what it threw, where that says anything', async () => {
    expect(await failureOfThrown(() => Promise.reject(new Error('The name is taken.')))).toBe(
      'The name is taken.',
    );
  });

  it('says something of its own where it threw nothing that does', async () => {
    expect(await failureOfThrown(() => Promise.reject(new Error('')), 'Try again.')).toBe(
      'Try again.',
    );
  });
});
