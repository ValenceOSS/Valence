import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteCursor } from './SiteCursor';

const pointing = (matches: boolean) =>
  vi.fn(() => ({
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SiteCursor', () => {
  it('hides the system pointer and draws its own where the mouse moves', () => {
    vi.stubGlobal('matchMedia', pointing(true));

    render(<SiteCursor />);

    expect(document.documentElement).toHaveClass('valence-cursor-none');
    expect(document.body.querySelector('.origin-top-left')).toBeNull();

    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 40, clientY: 60 });

    expect(document.body.querySelector('.origin-top-left')).not.toBeNull();
  });

  it('gives the system pointer back when it goes', () => {
    vi.stubGlobal('matchMedia', pointing(true));

    const { unmount } = render(<SiteCursor />);

    unmount();

    expect(document.documentElement).not.toHaveClass('valence-cursor-none');
  });

  it('leaves touch screens alone', () => {
    vi.stubGlobal('matchMedia', pointing(false));

    render(<SiteCursor />);

    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 40, clientY: 60 });

    expect(document.documentElement).not.toHaveClass('valence-cursor-none');
    expect(document.body.querySelector('.origin-top-left')).toBeNull();
  });

  it('draws itself on the body, outside whatever layer holds it, so menus cannot cover it', () => {
    vi.stubGlobal('matchMedia', pointing(true));

    const { container } = render(<SiteCursor />);

    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 40, clientY: 60 });

    expect(container.querySelector('.origin-top-left')).toBeNull();
    expect(document.body.querySelector('.origin-top-left')?.parentElement).toBe(document.body);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SiteCursor.displayName).toBe('SiteCursor');
  });
});
