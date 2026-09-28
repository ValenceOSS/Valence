import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangelogDate } from './ChangelogDate';

describe('ChangelogDate', () => {
  it('says when the release shipped and which version it was', () => {
    render(<ChangelogDate date="2026-09-25" version="v1.1.0" />);

    expect(screen.getByText('25 September 2026')).toHaveAttribute('dateTime', '2026-09-25');
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChangelogDate.displayName).toBe('ChangelogDate');
  });
});
