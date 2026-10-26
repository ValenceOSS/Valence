import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShareLinkReady } from './ShareLinkReady';

const LINK = 'https://watch.example.test/s/k3Fz9QwL';

describe('ShareLinkReady', () => {
  it('shows the link once it is made', () => {
    render(<ShareLinkReady link={LINK} isCopied={false} onCopy={vi.fn()} />);

    expect(screen.getByLabelText('Share link')).toHaveValue(LINK);
  });

  it('copies the link when asked', async () => {
    const onCopy = vi.fn();

    render(<ShareLinkReady link={LINK} isCopied={false} onCopy={onCopy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('says it was copied', () => {
    render(<ShareLinkReady link={LINK} isCopied onCopy={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShareLinkReady.displayName).toBe('ShareLinkReady');
  });
});
