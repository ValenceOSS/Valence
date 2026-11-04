import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServerCallingCard } from './ServerCallingCard';

const drawn = (standing?: string) =>
  render(
    <ServerCallingCard
      name="Elsewhere"
      colour="#3a8ee8"
      picture={null}
      address="https://elsewhere.example"
      fingerprint="0123456789abcdef"
      {...(standing === undefined ? {} : { standing })}
    >
      <button type="button">Change</button>
    </ServerCallingCard>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ServerCallingCard', () => {
  it('names the server, where it is and its fingerprint in groups to read out', () => {
    drawn('Linked');

    expect(screen.getByText('Elsewhere')).toBeInTheDocument();
    expect(screen.getByText('https://elsewhere.example')).toBeInTheDocument();
    expect(screen.getByText('0123 4567 89ab cdef')).toBeInTheDocument();
    expect(screen.getByText('Linked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('copies the fingerprint whole, and says it did', async () => {
    const writeText = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    drawn();

    await userEvent.click(screen.getByRole('button', { name: 'Copy the fingerprint' }));

    expect(writeText).toHaveBeenCalledWith('0123456789abcdef');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ServerCallingCard.displayName).toBe('ServerCallingCard');
  });
});
