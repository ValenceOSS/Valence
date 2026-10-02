import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecentEmails } from './RecentEmails';

const NOW = Date.parse('2026-10-02T12:00:00Z');

describe('RecentEmails', () => {
  it('says nothing has been sent yet', () => {
    render(<RecentEmails sends={[]} now={NOW} />);

    expect(screen.getByText('Nothing has been sent yet.')).toBeInTheDocument();
  });

  it('lists what went and what failed, with why', () => {
    render(
      <RecentEmails
        now={NOW}
        sends={[
          {
            id: '1',
            kind: 'passwordReset',
            recipient: 'ada@example.com',
            state: 'sent',
            failure: null,
            createdAt: '2026-10-02T11:59:00Z',
          },
          {
            id: '2',
            kind: 'test',
            recipient: 'grace@example.com',
            state: 'failed',
            failure: null,
            createdAt: '2026-10-02T11:00:00Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('Password reset')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Test email')).toBeInTheDocument();
    expect(screen.getByText('Failed: no reason was given')).toBeInTheDocument();
  });
});
