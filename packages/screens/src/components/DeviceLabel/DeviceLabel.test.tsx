import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeviceIdentitySchema } from '@ValenceContracts/schemas/DeviceIdentity';
import { DeviceLabel } from './DeviceLabel';

const AN_IPHONE = DeviceIdentitySchema.parse({
  app: 'phone',
  system: 'ios',
  form: 'phone',
  model: 'iPhone 17 Pro Max',
});

/**
 * The marks drawn beside the words, by the file each is painted through.
 */
const marksDrawn = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('[style]'), (mark) => mark.getAttribute('style') ?? '');

describe('DeviceLabel', () => {
  it('names the device and what it reaches Valence through on one line', () => {
    const { container } = render(
      <DeviceLabel device="iPhone 17 Pro Max" client="Valence for iOS" identity={AN_IPHONE} />,
    );

    expect(screen.getByText('iPhone 17 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Valence for iOS')).toBeInTheDocument();
    expect(container).toHaveTextContent('iPhone 17 Pro Max · Valence for iOS');
  });

  it('names only the device where its client is not known', () => {
    const { container } = render(<DeviceLabel device="Living room TV" />);

    expect(container).toHaveTextContent(/^Living room TV$/u);
  });

  it('draws the system’s mark beside the device and Valence’s beside its app', () => {
    const { container } = render(
      <DeviceLabel device="iPhone 17 Pro Max" client="Valence for iOS" identity={AN_IPHONE} />,
    );

    expect(marksDrawn(container)).toHaveLength(2);
    expect(marksDrawn(container)[0]).toMatch(/apple/iu);
    expect(marksDrawn(container)[1]).toMatch(/mask/iu);
  });

  it('draws a browser’s own mark beside the browser', () => {
    const { container } = render(
      <DeviceLabel
        device="Windows PC"
        client="Firefox on Windows"
        identity={DeviceIdentitySchema.parse({
          app: 'browser',
          system: 'windows',
          form: 'computer',
          browser: 'firefox',
        })}
      />,
    );

    expect(marksDrawn(container)[1]).toMatch(/firefox/iu);
  });

  it('draws a television whose maker’s mark is a word by its shape instead', () => {
    const { container } = render(
      <DeviceLabel
        device="LG TV"
        client="TV browser"
        identity={DeviceIdentitySchema.parse({ app: 'browser', system: 'webos', form: 'tv' })}
      />,
    );

    expect(marksDrawn(container)).toEqual([]);
  });

  it('keeps its marks from a screen reader, since the words already say it', () => {
    const { container } = render(
      <DeviceLabel device="iPhone 17 Pro Max" client="Valence for iOS" identity={AN_IPHONE} />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DeviceLabel.displayName).toBe('DeviceLabel');
  });
});
