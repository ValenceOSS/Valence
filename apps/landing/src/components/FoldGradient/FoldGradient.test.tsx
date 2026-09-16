import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ShaderMountProps } from '@paper-design/shaders-react';
import { FoldGradient } from './FoldGradient';

const asNumberAttribute = (value: number | undefined): string =>
  typeof value === 'number' ? value.toString() : '';

vi.mock('@paper-design/shaders-react', () => ({
  ShaderMount: (props: ShaderMountProps) => (
    <div
      data-testid="shader-mount"
      data-color-count={asNumberAttribute(
        typeof props.uniforms.u_ncols === 'number' ? props.uniforms.u_ncols : undefined,
      )}
      data-speed={asNumberAttribute(props.speed)}
      className={props.className}
    />
  ),
}));

describe('FoldGradient', () => {
  it('builds one uniform colour stop per colour it was given', () => {
    render(<FoldGradient colors={['#ff0000', '#00ff00', '#0000ff']} />);

    expect(screen.getByTestId('shader-mount')).toHaveAttribute('data-color-count', '3');
  });

  it('falls back to the designed palette when no colours are given', () => {
    render(<FoldGradient />);

    expect(screen.getByTestId('shader-mount')).toHaveAttribute('data-color-count', '5');
  });

  it('passes speed and the layout classes it was given through to the shader mount', () => {
    render(<FoldGradient speed={0} className="absolute inset-0" />);

    const mount = screen.getByTestId('shader-mount');

    expect(mount).toHaveAttribute('data-speed', '0');
    expect(mount).toHaveClass('absolute', 'inset-0');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FoldGradient.displayName).toBe('FoldGradient');
  });
});
