import { afterEach, describe, expect, it } from 'vitest';
import { applyPluginTheme } from './applyPluginTheme';

const root = document.documentElement;

afterEach(() => {
  applyPluginTheme(null);
  root.style.removeProperty('--radius-scale');
});

describe('applyPluginTheme', () => {
  it('puts a theme’s colours on the document and marks it', () => {
    applyPluginTheme({ '--color-accent': '#123456', '--radius-scale': '1.6' });

    expect(root.style.getPropertyValue('--color-accent')).toBe('#123456');
    expect(root.style.getPropertyValue('--radius-scale')).toBe('1.6');
    expect(root.dataset['pluginTheme']).toBe('on');
  });

  it('never sets a property it does not own', () => {
    applyPluginTheme({ '--color-accent': '#123456', background: 'url(https://evil.example)' });

    expect(root.style.getPropertyValue('background')).toBe('');
  });

  it('takes its colours off again', () => {
    applyPluginTheme({ '--color-accent': '#123456' });
    applyPluginTheme(null);

    expect(root.style.getPropertyValue('--color-accent')).toBe('');
    expect(root.dataset['pluginTheme']).toBeUndefined();
  });
});
