import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ConcernMark } from './ConcernMark';

describe('ConcernMark', () => {
  it('colours a broken thing red', () => {
    const { container } = render(<ConcernMark tone="broken" />);

    expect(container.firstElementChild?.className).toContain('text-danger');
  });

  it('colours something needing attention amber', () => {
    const { container } = render(<ConcernMark tone="attention" />);

    expect(container.firstElementChild?.className).toContain('text-busy');
  });

  it('mutes something still being set up', () => {
    const { container } = render(<ConcernMark tone="setup" />);

    expect(container.firstElementChild?.className).toContain('text-text-muted');
  });
});
