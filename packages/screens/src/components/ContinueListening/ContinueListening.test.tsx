import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aListening } from '@ValenceClient/testing/aListening';
import { ContinueListening } from './ContinueListening';
import type { BookListening } from '@ValenceContracts/schemas/Book';

/**
 * Serves what somebody has been listening to.
 */
const serve = (listenings: BookListening[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify({ listenings }), { status: 200 }))),
  );
};

beforeEach(() => {
  installATestClient();
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('ContinueListening', () => {
  it('lists the audiobooks somebody is partway through, saying where and how long is left', async () => {
    serve([aListening()]);

    renderInAnAddress(<ContinueListening onOpen={vi.fn()} />);

    expect(await screen.findByText('Continue listening')).toBeInTheDocument();
    expect(screen.getByText('Part 2 · 9 min left')).toBeInTheDocument();
  });

  it('draws nothing where everything was finished', async () => {
    serve([aListening({ isFinished: true })]);

    const { container } = renderInAnAddress(<ContinueListening onOpen={vi.fn()} />);

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the book chosen', async () => {
    const onOpen = vi.fn();

    serve([aListening()]);

    renderInAnAddress(<ContinueListening onOpen={onOpen} />);

    await userEvent.click(await screen.findByText('Red Rising'));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ title: 'Red Rising' }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContinueListening.displayName).toBe('ContinueListening');
  });
});
