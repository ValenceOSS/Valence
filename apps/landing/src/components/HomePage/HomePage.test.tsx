import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

vi.mock('@paper-design/shaders-react', () => ({
  ShaderMount: () => <div data-testid="shader-mount" />,
}));

describe('HomePage', () => {
  it('opens with the hero', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: /Your films and programmes/ })).toBeInTheDocument();
  });

  it('draws every feature group', () => {
    render(<HomePage />);

    expect(screen.getByRole('region', { name: 'Viewing' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Platform' })).toBeInTheDocument();
  });

  it('shows the app itself within the hero', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app open on a title's page, with the continue-watching rail beneath it",
      }),
    ).toHaveAttribute('src', '/hero.jpeg');
  });

  it('makes a statement about who the data belongs to', () => {
    render(<HomePage />);

    expect(screen.getByRole('region', { name: 'On your data' })).toBeInTheDocument();
  });

  it('draws the comparison table', () => {
    render(<HomePage />);

    expect(screen.getByRole('region', { name: 'How it compares' })).toBeInTheDocument();
  });

  it('closes with a call to action', () => {
    render(<HomePage />);

    expect(screen.getByText('Run it on what you already have')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomePage.displayName).toBe('HomePage');
  });
});
