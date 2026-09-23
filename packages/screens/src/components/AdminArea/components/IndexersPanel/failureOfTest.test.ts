import { describe, expect, it } from 'vitest';
import { failureOfTest } from './failureOfTest';

const ANSWERED = { problem: null, problemCode: null, capabilities: null, captcha: null };

describe('failureOfTest', () => {
  it('says nothing where the indexer answered', () => {
    expect(
      failureOfTest('Jackett', { value: { ...ANSWERED, isWorking: true }, refusal: null }),
    ).toBe(null);
  });

  it('names the indexer and its problem where it did not answer', () => {
    expect(
      failureOfTest('Jackett', {
        value: { ...ANSWERED, isWorking: false, problem: 'Timed out' },
        refusal: null,
      }),
    ).toBe('Jackett: Timed out');
  });

  it('still says it failed where no reason came back', () => {
    expect(
      failureOfTest('Jackett', { value: { ...ANSWERED, isWorking: false }, refusal: null }),
    ).toBe('Jackett: did not answer');
  });

  it('gives the refusal where the server would not test it', () => {
    expect(
      failureOfTest('Jackett', { value: null, refusal: { message: 'Requesting is off.' } }),
    ).toBe('Requesting is off.');
  });
});
