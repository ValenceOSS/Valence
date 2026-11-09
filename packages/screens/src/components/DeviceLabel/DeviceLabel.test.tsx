import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const USER_AGENT = 'Valence/1 CFNetwork/3826 Darwin/25.0.0';

/**
 * Rests the pointer on some words for longer than a tooltip waits before it appears.
 *
 * @param words - The words to rest on.
 * @returns Every tooltip showing afterwards.
 */
const restOn = async (words: string): Promise<Element[]> => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  await user.hover(screen.getByText(words));
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  return Array.from(document.querySelectorAll('[data-slot="tooltip-content"]'));
};

/**
 * Makes every name measure wider than the room it has, as a long one does in a narrow column.
 */
const cuttingEveryName = () => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DeviceLabel', () => {
  it('names the device and what it reaches Valence through on one line', () => {
    const { container } = render(
      <DeviceLabel device="iPhone 17 Pro Max" client="Valence for iOS" identity={AN_IPHONE} />,
    );

    expect(screen.getByText('iPhone 17 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Valence for iOS')).toBeInTheDocument();
    expect(container).toHaveTextContent('iPhone 17 Pro Max · Valence for iOS');
  });

  it('names what it reaches Valence through on hover, with the user agent it sent beneath', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <DeviceLabel
        device="iPhone 17 Pro Max"
        client="Valence for iOS"
        identity={AN_IPHONE}
        userAgent={USER_AGENT}
      />,
    );

    const tips = await restOn('iPhone 17 Pro Max');

    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent('Valence for iOS');
    expect(tips[0]).toHaveTextContent(USER_AGENT);
  });

  it('names the device on hover where what it reaches Valence through is not known', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<DeviceLabel device="iPhone 17 Pro Max" userAgent={USER_AGENT} />);

    const tips = await restOn('iPhone 17 Pro Max');

    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent('iPhone 17 Pro Max');
    expect(tips[0]).toHaveTextContent(USER_AGENT);
  });

  it('gives the cut-off names no tooltips of their own where the user agent already has one', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    cuttingEveryName();

    render(
      <DeviceLabel
        device="iPhone 17 Pro Max"
        client="Valence for iOS"
        identity={AN_IPHONE}
        userAgent={USER_AGENT}
      />,
    );

    expect(await restOn('Valence for iOS')).toHaveLength(1);
  });

  it('says nothing on hover where the device sent no user agent and its names fit', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <DeviceLabel device="iPhone 17 Pro Max" client="Valence for iOS" identity={AN_IPHONE} />,
    );

    expect(await restOn('iPhone 17 Pro Max')).toHaveLength(0);
  });

  it('says a name in full on hover where it is cut off and the device sent no user agent', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    cuttingEveryName();

    render(
      <DeviceLabel device="iPhone 17 Pro Max" client="Valence for iOS" identity={AN_IPHONE} />,
    );

    const tips = await restOn('Valence for iOS');

    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent(/^Valence for iOS$/u);
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
