import { describe, expect, it } from 'vitest';
import { namesInTitle } from './namesInTitle';

describe('namesInTitle', () => {
  it('gives each name of a title written in several languages', () => {
    expect(namesInTitle('间谍过家家 / SPY×FAMILY')).toEqual([
      '间谍过家家 / SPY×FAMILY',
      '间谍过家家',
      'SPY×FAMILY',
    ]);
    expect(namesInTitle('Название | Title')).toEqual(['Название | Title', 'Название', 'Title']);
  });

  it('leaves a title with a slash inside a word whole', () => {
    expect(namesInTitle('Fate/Zero')).toEqual(['Fate/Zero']);
  });
});
