import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { choosePluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { useAppliedPluginTheme } from './useAppliedPluginTheme';
import type { ReactNode } from 'react';

const fetchPluginContributions = vi.hoisted(() => vi.fn());
const fetchAppearance = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({ fetchPluginContributions }));
vi.mock('@ValenceClient/appearance/fetchAppearance', () => ({ fetchAppearance }));

const TOKENS = {
  accent: '#3b82f6',
  accentContrast: '#ffffff',
  surface: '#0b0b10',
  surfaceRaised: '#15151c',
  text: '#f5f5f7',
  textMuted: '#a0a0aa',
  border: '#2a2a33',
  danger: '#f87171',
  highlight: '#facc15',
  success: '#4ade80',
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const accent = () => document.documentElement.style.getPropertyValue('--color-accent');

beforeEach(() => {
  installATestClient();
  fetchAppearance.mockReset().mockResolvedValue({ roundness: 'soft' });
  fetchPluginContributions.mockReset().mockResolvedValue({
    pages: [],
    panels: [],
    themes: [
      {
        id: 'deep-sea',
        name: 'Deep sea',
        corners: 'round',
        dark: TOKENS,
        pluginId: 'midnight',
        pluginName: 'Midnight',
      },
    ],
  });
});

afterEach(() => {
  document.documentElement.removeAttribute('style');
  delete document.documentElement.dataset['pluginTheme'];
});

describe('useAppliedPluginTheme', () => {
  it('asks for nothing and changes nothing until somebody chooses a plugin theme', async () => {
    renderHook(() => useAppliedPluginTheme(), { wrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--radius-scale')).toBe('0.6');
    });

    expect(fetchPluginContributions).not.toHaveBeenCalled();
    expect(accent()).toBe('');
  });

  it('puts the chosen theme on in the scheme in force, and takes it off for a scheme it lacks', async () => {
    chooseTheme('dark');
    choosePluginTheme('midnight/deep-sea');

    renderHook(() => useAppliedPluginTheme(), { wrapper });

    await waitFor(() => {
      expect(accent()).toBe('#3b82f6');
    });

    expect(document.documentElement.style.getPropertyValue('--radius-scale')).toBe('1.6');

    act(() => {
      chooseTheme('light');
    });

    await waitFor(() => {
      expect(accent()).toBe('');
    });

    expect(document.documentElement.style.getPropertyValue('--radius-scale')).toBe('0.6');
  });

  it('falls back to Valence’s own colours when the plugin has gone', async () => {
    chooseTheme('dark');
    choosePluginTheme('removed/theme');

    renderHook(() => useAppliedPluginTheme(), { wrapper });

    await waitFor(() => {
      expect(fetchPluginContributions).toHaveBeenCalled();
    });

    expect(accent()).toBe('');
  });
});
