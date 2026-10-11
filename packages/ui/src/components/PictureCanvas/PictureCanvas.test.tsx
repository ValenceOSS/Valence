import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PictureCanvas } from './PictureCanvas';

describe('PictureCanvas', () => {
  it('hands its canvas to the player and keeps it out of the way of the pointer', () => {
    const canvasRef = createRef<HTMLCanvasElement>();

    render(<PictureCanvas canvasRef={canvasRef} isShown />);

    expect(canvasRef.current).toBeInstanceOf(HTMLCanvasElement);
    expect(canvasRef.current).toHaveClass('pointer-events-none');
    expect(canvasRef.current).not.toHaveClass('hidden');
  });

  it('stays out of sight while nothing is being drawn on it', () => {
    const canvasRef = createRef<HTMLCanvasElement>();

    render(<PictureCanvas canvasRef={canvasRef} isShown={false} />);

    expect(canvasRef.current).toHaveClass('hidden');
    expect(canvasRef.current).toHaveAttribute('aria-hidden', 'true');
  });
});
