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

  it('gives a second name written in brackets after the first', () => {
    expect(namesInTitle('Tantei wa Mou, Shindeiru (The Detective Is Already Dead)')).toEqual([
      'Tantei wa Mou, Shindeiru (The Detective Is Already Dead)',
      'Tantei wa Mou, Shindeiru',
      'The Detective Is Already Dead',
    ]);
    expect(namesInTitle('Hunter x Hunter (2011)')).toEqual(['Hunter x Hunter (2011)']);
  });

  it('leaves a title with a slash inside a word whole', () => {
    expect(namesInTitle('Fate/Zero')).toEqual(['Fate/Zero']);
  });
});
