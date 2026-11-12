import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { MoodBackgroundProps } from '@ValenceUI/MoodBackground.types';
import { setHomeLights } from '@ValenceScreens/library/homeLights';
import { setMusicLights } from '@ValenceScreens/music/musicLights';
import { ShellMood } from './ShellMood';

const HOME = [{ color: 'rgb(90 60 140)', at: '20% 30%' }];

const MUSIC = [{ color: 'rgb(140 60 20)', at: '70% 40%' }];

vi.mock('@ValenceUI/MoodBackground', () => ({
  MoodBackground: ({ lights = [] }: MoodBackgroundProps) => (
    <div data-testid="mood" data-lights={JSON.stringify(lights)} />
  ),
}));

const LIGHTS = z.array(z.object({ color: z.string(), at: z.string().optional() }));

const firstBloomOf = (container: HTMLElement): string | undefined =>
  LIGHTS.parse(
    JSON.parse(
      container.querySelector('[data-testid="mood"]')?.getAttribute('data-lights') ?? '[]',
    ),
  )[0]?.color;

afterEach(() => {
  setHomeLights([]);
  setMusicLights([]);
});

describe('ShellMood', () => {
  it('lights the home page with the home page’s lights', () => {
    setHomeLights(HOME);
    setMusicLights(MUSIC);

    const { container } = render(<ShellMood section="home" />);

    expect(firstBloomOf(container)).toBe('rgb(90 60 140)');
  });

  it('leaves music unlit, whatever the album’s lights, since its page is lit by its own artwork', () => {
    setHomeLights(HOME);
    setMusicLights(MUSIC);

    const { container } = render(<ShellMood section="music" />);

    expect(firstBloomOf(container)).toBeUndefined();
  });

  it('follows the home page’s lights as they change, without being drawn again from above', () => {
    const { container } = render(<ShellMood section="home" />);

    act(() => {
      setHomeLights(HOME);
    });

    expect(firstBloomOf(container)).toBe('rgb(90 60 140)');
  });

  it('leaves every other section in the house’s own lights', () => {
    setHomeLights(HOME);

    const { container } = render(<ShellMood section="films" />);

    expect(firstBloomOf(container)).not.toBe('rgb(90 60 140)');
  });
});
