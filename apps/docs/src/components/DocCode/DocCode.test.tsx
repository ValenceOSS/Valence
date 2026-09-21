import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DocCode } from '@ValenceDocs/components/DocCode/DocCode';

describe('DocCode', () => {
  it('labels the block with its language', () => {
    render(
      <DocCode>
        <code className="hljs language-bash">docker compose up -d</code>
      </DocCode>,
    );

    expect(screen.getByText('bash')).toBeInTheDocument();
  });

  it('falls back to text where it has no language', () => {
    render(<DocCode>plain</DocCode>);

    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('copies the code and says so', async () => {
    const user = userEvent.setup();

    render(
      <DocCode>
        <code className="language-bash">echo hi</code>
      </DocCode>,
    );

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe('echo hi');
    });
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });
});
