import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.unstubAllGlobals();
});

describe('ThemeToggle', () => {
  it('sets the page to the theme it opens in', async () => {
    render(<ThemeToggle />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(await screen.findByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('opens in the theme the visitor chose last time', async () => {
    window.localStorage.setItem('valence-landing-theme', 'light');

    render(<ThemeToggle />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(await screen.findByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });

  it('switches the page over and remembers it', async () => {
    render(<ThemeToggle />);

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to light mode' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('valence-landing-theme')).toBe('light');
    expect(await screen.findByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ThemeToggle.displayName).toBe('ThemeToggle');
  });
});
