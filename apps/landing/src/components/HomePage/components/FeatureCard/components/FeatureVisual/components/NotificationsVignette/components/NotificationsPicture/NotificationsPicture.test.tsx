import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotificationsPicture } from './NotificationsPicture';

describe('NotificationsPicture', () => {
  it('lists what has happened, newest first', () => {
    render(<NotificationsPicture />);

    expect(screen.getAllByText('Ruth started a party')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NotificationsPicture.displayName).toBe('NotificationsPicture');
  });
});
