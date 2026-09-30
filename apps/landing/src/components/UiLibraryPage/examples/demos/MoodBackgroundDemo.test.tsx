import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MoodBackgroundDemo } from './MoodBackgroundDemo';

describe('MoodBackgroundDemo', () => {
  it('moves between moods', async () => {
    render(<MoodBackgroundDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Warm' }));

    expect(screen.getByRole('button', { name: 'Warm' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MoodBackgroundDemo.displayName).toBe('MoodBackgroundDemo');
  });
});
