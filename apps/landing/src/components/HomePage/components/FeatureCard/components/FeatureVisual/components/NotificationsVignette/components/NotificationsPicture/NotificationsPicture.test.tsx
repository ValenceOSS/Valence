import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotificationsPicture } from './NotificationsPicture';

describe('NotificationsPicture', () => {
  it('lists what has happened, newest first, on the app’s own list', () => {
    render(<NotificationsPicture />);

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('New episode')).toBeInTheDocument();
    expect(screen.getByText('Your request arrived')).toBeInTheDocument();
    expect(screen.queryByText('Ruth started a party')).toBeNull();
  });

  it('brings another in on top once acted out', () => {
    render(<NotificationsPicture isActed />);

    expect(screen.getByText('Ruth started a party')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NotificationsPicture.displayName).toBe('NotificationsPicture');
  });
});
