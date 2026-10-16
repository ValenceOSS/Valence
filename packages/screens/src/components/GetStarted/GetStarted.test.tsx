import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { GetStartedProps, GetStartedStep } from './GetStarted.types';
import { GetStarted } from './GetStarted';

const aStep = (change: Partial<GetStartedStep> = {}): GetStartedStep => ({
  id: 'picture',
  title: 'Add a profile picture',
  description: 'So everyone can see who is watching.',
  actionLabel: 'Choose a picture',
  status: 'open',
  onAction: vi.fn(),
  ...change,
});

const props = (change: Partial<GetStartedProps> = {}): GetStartedProps => ({
  title: 'Get started with Valence',
  sections: [
    {
      id: 'yours',
      title: 'Make it yours',
      steps: [
        aStep({ id: 'done', title: 'Keep a favourite', status: 'done' }),
        aStep(),
        aStep({ id: 'later', title: 'Add a passkey' }),
      ],
    },
    { id: 'more', title: 'Discover more', steps: [aStep({ id: 'phone', title: 'Get the app' })] },
  ],
  isCollapsed: false,
  onCollapsedChange: vi.fn(),
  onSkip: vi.fn(),
  onSkipAll: vi.fn(),
  ...change,
});

describe('GetStarted', () => {
  it('sits in the corner as a landmark named for what it is', () => {
    render(<GetStarted {...props()} />);

    expect(screen.getByRole('complementary', { name: 'Get started with Valence' })).toBeVisible();
  });

  it('holds open the next step still to do, with why and the way to do it', () => {
    render(<GetStarted {...props()} />);

    expect(screen.getByText('So everyone can see who is watching.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose a picture' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get the app' })).not.toBeInTheDocument();
  });

  it('does the step when its action is pressed', async () => {
    const onAction = vi.fn();

    render(
      <GetStarted
        {...props({
          sections: [{ id: 'yours', title: 'Make it yours', steps: [aStep({ onAction })] }],
        })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Choose a picture' }));

    expect(onAction).toHaveBeenCalled();
  });

  it('skips the step open', async () => {
    const onSkip = vi.fn();

    render(<GetStarted {...props({ onSkip })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSkip).toHaveBeenCalledWith('picture');
  });

  it('strikes through a step that is done', () => {
    render(<GetStarted {...props()} />);

    expect(screen.getByText('Keep a favourite')).toHaveClass('line-through');
  });

  it('counts how many steps are finished', () => {
    render(<GetStarted {...props()} />);

    expect(screen.getByText('/4 completed')).toBeInTheDocument();
  });

  it('opens another group when its heading is pressed', async () => {
    render(<GetStarted {...props()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Discover more' }));

    expect(screen.getByRole('button', { name: 'Get the app' })).toBeInTheDocument();
  });

  it('opens another step when it is pressed', async () => {
    render(<GetStarted {...props()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

    expect(screen.getAllByRole('button', { name: 'Choose a picture' })).toHaveLength(1);
  });

  it('folds away and opens from its heading', async () => {
    const onCollapsedChange = vi.fn();

    render(<GetStarted {...props({ onCollapsedChange })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Get started with Valence' }));

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('shows only the heading and a count once folded', () => {
    render(<GetStarted {...props({ isCollapsed: true })} />);

    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.queryByText('Make it yours')).not.toBeInTheDocument();
  });

  it('puts the list away for good', async () => {
    const onSkipAll = vi.fn();

    render(<GetStarted {...props({ onSkipAll })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Skip all' }));

    expect(onSkipAll).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GetStarted.displayName).toBe('GetStarted');
  });
});
