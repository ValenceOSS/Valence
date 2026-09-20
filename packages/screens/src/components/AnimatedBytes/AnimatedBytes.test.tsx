import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedBytes } from './AnimatedBytes';

describe('AnimatedBytes', () => {
  it('writes a size the way every other size is written', () => {
    const { container } = render(<AnimatedBytes bytes={356 * 1024 ** 2} />);

    expect(container).toHaveTextContent('356 MB');
  });

  it('keeps a decimal place below ten', () => {
    const { container } = render(<AnimatedBytes bytes={1.4 * 1024 ** 3} />);

    expect(container).toHaveTextContent('1.4 GB');
  });

  it('writes what follows the unit straight after it', () => {
    const { container } = render(<AnimatedBytes bytes={157 * 1024 ** 3} suffix=" free" />);

    expect(container).toHaveTextContent('157 GB free');
  });

  it('writes what comes before the number straight against it', () => {
    const { container } = render(<AnimatedBytes bytes={2048} prefix="↓ " suffix="/s" />);

    expect(container).toHaveTextContent('↓ 2.0 KB/s');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnimatedBytes.displayName).toBe('AnimatedBytes');
  });
});
