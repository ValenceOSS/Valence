import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinuxMark } from './LinuxMark';

describe('LinuxMark', () => {
  it('draws Linux’s mark at the size it is asked for, beside words that already say Linux', () => {
    const { container } = render(<LinuxMark size={18} className="text-text-muted" />);
    const mark = container.firstElementChild;

    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).toHaveClass('text-text-muted');
    expect(mark?.getAttribute('style')).toContain('linux');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LinuxMark.displayName).toBe('LinuxMark');
  });
});
