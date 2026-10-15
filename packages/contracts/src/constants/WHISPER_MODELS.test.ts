import { describe, expect, it } from 'vitest';
import { WHISPER_MODELS } from './WHISPER_MODELS';

describe('WHISPER_MODELS', () => {
  it('names the models by the names whisper.cpp publishes them under, smallest first', () => {
    expect(WHISPER_MODELS).toEqual(['tiny', 'base', 'small', 'medium', 'large-v3-turbo']);
  });
});
