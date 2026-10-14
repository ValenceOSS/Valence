import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NoticeCard } from './NoticeCard';

afterEach(() => {
  vi.useRealTimers();
});

describe('NoticeCard', () => {
  it('says what happened and a line more', () => {
    render(
      <NoticeCard
        tone="worked"
        title="Saved"
        description="Your changes are kept."
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes are kept.')).toBeInTheDocument();
  });

  it('shows short tags worth reading at a glance', () => {
    render(
      <NoticeCard tone="info" title="Scanned" tags={['Films', '12 new']} onDismiss={vi.fn()} />,
    );

    expect(screen.getByText('Films')).toBeInTheDocument();
    expect(screen.getByText('12 new')).toBeInTheDocument();
  });

  it('is dismissed from its footer', async () => {
    const onDismiss = vi.fn();

    render(<NoticeCard tone="warning" title="Careful" onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('does its one action and goes away', async () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();

    render(
      <NoticeCard
        tone="worked"
        title="Removed"
        action={{ label: 'Undo', onPress }}
        onDismiss={onDismiss}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onPress).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('counts down to when it closes', () => {
    vi.useFakeTimers();

    render(<NoticeCard tone="info" title="Hello" countdown={{ seconds: 3 }} onDismiss={vi.fn()} />);

    expect(screen.getByText('This message will close in')).toBeInTheDocument();
    expect(screen.getByText('3 seconds')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('1 second')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('0 seconds')).toBeInTheDocument();
  });

  it('says what happens when the count runs out, where it is told', () => {
    render(
      <NoticeCard
        tone="failed"
        title="Deleting"
        countdown={{ seconds: 5, lead: 'Deleting for good in' }}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText('Deleting for good in')).toBeInTheDocument();
    expect(screen.getByText('5 seconds')).toHaveClass('text-danger');
  });

  it('draws each kind of notice with its own mark', () => {
    for (const tone of ['info', 'worked', 'failed', 'working', 'warning'] as const) {
      const { unmount, container } = render(
        <NoticeCard tone={tone} title="A notice" onDismiss={vi.fn()} />,
      );

      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NoticeCard.displayName).toBe('NoticeCard');
  });
});
