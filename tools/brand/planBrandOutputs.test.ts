import { describe, expect, it } from 'vitest';
import { planBrandOutputs } from './planBrandOutputs';

describe('planBrandOutputs', () => {
  const outputs = planBrandOutputs();

  it('copies the logo to every app that serves it itself', () => {
    expect(
      outputs.filter((output) => output.kind === 'copy' && output.from.endsWith('.svg')),
    ).toEqual(
      ['web', 'desktop', 'docs', 'landing'].map((app) => ({
        kind: 'copy',
        from: 'design/valence-logo.svg',
        to: `apps/${app}/public/valence-logo.svg`,
      })),
    );
  });

  it('renders the browser tab icon for the web, docs and landing pages', () => {
    expect(
      outputs.filter((output) => output.kind === 'icon' && output.to.endsWith('public/icon.png')),
    ).toEqual(
      ['web', 'docs', 'landing'].map((app) => ({
        kind: 'icon',
        from: 'design/valence-icon.icon',
        to: `apps/${app}/public/icon.png`,
        pixels: 256,
        margin: 0,
      })),
    );
  });

  it('renders the icon the README shows', () => {
    expect(outputs).toContainEqual({
      kind: 'icon',
      from: 'design/valence-icon.icon',
      to: 'assets/valence-icon.png',
      pixels: 256,
      margin: 0,
    });
  });

  it('gives the desktop the bundle for the Mac, a flat icon, and a dock icon with the Mac margin', () => {
    expect(outputs.filter((output) => output.to.startsWith('apps/desktop/build'))).toEqual([
      { kind: 'copy', from: 'design/valence-icon.icon', to: 'apps/desktop/build/icon.icon' },
      {
        kind: 'icon',
        from: 'design/valence-icon.icon',
        to: 'apps/desktop/build/icon.png',
        pixels: 1024,
        margin: 0,
      },
      {
        kind: 'icon',
        from: 'design/valence-icon.icon',
        to: 'apps/desktop/build/icon-dev.png',
        pixels: 1024,
        margin: 100,
      },
    ]);
  });

  it('draws every Apple TV icon and top shelf at the size tvOS asks for', () => {
    expect(
      outputs.flatMap((output) =>
        output.kind === 'banner' ? [[output.to, output.width, output.height]] : [],
      ),
    ).toEqual([
      ['apps/tv/assets/tv-icons/icon.png', 1280, 768],
      ['apps/tv/assets/tv-icons/iconSmall.png', 400, 240],
      ['apps/tv/assets/tv-icons/iconSmall2x.png', 800, 480],
      ['apps/tv/assets/tv-icons/topShelf.png', 1920, 720],
      ['apps/tv/assets/tv-icons/topShelf2x.png', 3840, 1440],
      ['apps/tv/assets/tv-icons/topShelfWide.png', 2320, 720],
      ['apps/tv/assets/tv-icons/topShelfWide2x.png', 4640, 1440],
    ]);
  });

  it('draws the logo for the phone and television in the logo’s own proportions', () => {
    for (const output of outputs) {
      if (output.kind === 'mark') {
        expect(output.width / output.height).toBeCloseTo(624 / 458, 1);
      }
    }
  });
});
