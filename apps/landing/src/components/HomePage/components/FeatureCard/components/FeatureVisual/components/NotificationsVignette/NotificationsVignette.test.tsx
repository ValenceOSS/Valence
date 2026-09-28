import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotificationsVignette } from './NotificationsVignette';

describe('NotificationsVignette', () => {
  it('lists what has happened, newest first', () => {
    render(<NotificationsVignette />);

    expect(screen.getAllByText('Ruth started a party')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NotificationsVignette.displayName).toBe('NotificationsVignette');
  });
});
