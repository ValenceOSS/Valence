import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResizablePanel } from './ResizablePanel';
import type * as MotionReact from 'motion/react';

const motion = vi.hoisted(() => ({ isReduced: true }));

vi.mock('motion/react', async () => ({
  ...(await vi.importActual<typeof MotionReact>('motion/react')),
  useReducedMotion: () => motion.isReduced,
  useReducedMotionConfig: () => motion.isReduced,
}));

const renderPanel = (onWidthChange = vi.fn()) => {
  render(
    <ResizablePanel
      label="Resize"
      defaultWidth={300}
      minWidth={200}
      maxWidth={400}
      onWidthChange={onWidthChange}
    >
      <p>Held</p>
    </ResizablePanel>,
  );

  return { edge: screen.getByRole('separator', { name: 'Resize' }), onWidthChange };
};

afterEach(() => {
  motion.isReduced = true;
});

describe('ResizablePanel', () => {
  it('holds what it is given beside an edge that says how wide it is', () => {
    const { edge } = renderPanel();

    expect(screen.getByText('Held')).toBeInTheDocument();
    expect(edge).toHaveAttribute('aria-valuenow', '300');
    expect(edge).toHaveAttribute('aria-valuemin', '200');
    expect(edge).toHaveAttribute('aria-valuemax', '400');
  });

  it('widens with the left arrow and narrows with the right', () => {
    const { edge, onWidthChange } = renderPanel();

    fireEvent.keyDown(edge, { key: 'ArrowLeft' });
    expect(onWidthChange).toHaveBeenLastCalledWith(316);
    expect(edge).toHaveAttribute('aria-valuenow', '316');

    fireEvent.keyDown(edge, { key: 'ArrowRight' });
    expect(onWidthChange).toHaveBeenLastCalledWith(300);
  });

  it('goes to its limits with Home and End', () => {
    const { edge, onWidthChange } = renderPanel();

    fireEvent.keyDown(edge, { key: 'End' });
    expect(onWidthChange).toHaveBeenLastCalledWith(400);

    fireEvent.keyDown(edge, { key: 'Home' });
    expect(onWidthChange).toHaveBeenLastCalledWith(200);
  });

  it('settles inside its limits however far it is dragged', () => {
    const { edge, onWidthChange } = renderPanel();

    edge.setPointerCapture = vi.fn();
    fireEvent.pointerDown(edge, { button: 0, clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(edge, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(edge, { clientX: 100, pointerId: 1 });

    expect(onWidthChange).toHaveBeenLastCalledWith(400);
  });

  it('widens with the right arrow when it is the trailing edge that is dragged', () => {
    const onWidthChange = vi.fn();

    render(
      <ResizablePanel
        label="Resize"
        edge="end"
        defaultWidth={300}
        minWidth={200}
        maxWidth={400}
        onWidthChange={onWidthChange}
      >
        <p>Held</p>
      </ResizablePanel>,
    );

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });

    expect(onWidthChange).toHaveBeenLastCalledWith(316);
  });

  it('puts the edge out of reach while disabled', () => {
    render(
      <ResizablePanel label="Resize" defaultWidth={300} minWidth={200} maxWidth={400} isDisabled>
        <p>Held</p>
      </ResizablePanel>,
    );

    expect(screen.queryByRole('separator')).toBeNull();
  });
});
