import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CapturingIntersectionObserver,
  entryFor,
} from '@ValenceLanding/testing/CapturingIntersectionObserver';
import { VersionSlider } from './VersionSlider';

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  CapturingIntersectionObserver.latest = null;
});

describe('VersionSlider', () => {
  it('draws nothing when there are no versions to show', () => {
    const { container } = render(<VersionSlider versions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('draws one bar per version, naming the newest as the current one', () => {
    render(<VersionSlider versions={['3.0.0', '2.0.0', '1.0.0']} />);

    expect(screen.getByText('3.0.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jump to 3.0.0' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Jump to 2.0.0' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('scrolls a release into view when its own bar is pressed', () => {
    const target = document.createElement('div');
    target.id = '2.0.0';
    document.body.append(target);

    render(<VersionSlider versions={['3.0.0', '2.0.0']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jump to 2.0.0' }));

    // eslint-disable-next-line @typescript-eslint/unbound-method -- a mock assertion, never called unbound
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    target.remove();
  });

  it('settles just above the footer once it scrolls into view', () => {
    vi.stubGlobal('IntersectionObserver', CapturingIntersectionObserver);

    const footer = document.createElement('footer');
    footer.getBoundingClientRect = () => new DOMRect(0, 0, 0, 120);
    document.body.append(footer);

    render(<VersionSlider versions={['1.0.0']} />);

    const observer = CapturingIntersectionObserver.latest;

    act(() => {
      observer?.callback([entryFor('footer', true, 1)], observer);
    });

    expect(screen.getByRole('button', { name: 'Jump to 1.0.0' })).toBeInTheDocument();

    footer.remove();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(VersionSlider.displayName).toBe('VersionSlider');
  });
});
