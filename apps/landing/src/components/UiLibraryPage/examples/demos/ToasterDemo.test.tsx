import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToasterDemo } from './ToasterDemo';

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
  vi.unstubAllGlobals();
});

describe('ToasterDemo', () => {
  it('raises a notice', async () => {
    render(<ToasterDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Success' }));

    expect(await screen.findByText('Library added')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ToasterDemo.displayName).toBe('ToasterDemo');
  });
});
