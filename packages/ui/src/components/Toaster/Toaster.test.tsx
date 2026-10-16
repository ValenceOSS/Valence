import { act, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from './Toaster';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  act(() => {
    toast.dismiss();
  });
  vi.unstubAllGlobals();
});

describe('Toaster', () => {
  it('shows a notice once one is raised', async () => {
    render(<Toaster />);

    act(() => {
      toast('Saved');
    });

    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('takes notices addressed to it by name', async () => {
    render(<Toaster id="player" />);

    act(() => {
      toast('For the player', { toasterId: 'player' });
    });

    expect(await screen.findByText('For the player')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Toaster.displayName).toBe('Toaster');
  });
});
