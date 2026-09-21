import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageTurn } from './PageTurn';

const draw = (overrides: Partial<Parameters<typeof PageTurn>[0]> = {}) =>
  render(
    <PageTurn
      from={[0, 1]}
      to={[2, 3]}
      isAdvancing
      isRightToLeft={false}
      gap={0}
      renderPage={(page) => <span key={page}>{`p${page.toString()}`}</span>}
      onDone={vi.fn()}
      {...overrides}
    />,
  );

const pagesIn = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('span')].map((span) => span.textContent);

describe('PageTurn', () => {
  it('leaves the first page where it was and uncovers the next pair’s second, going on', () => {
    const { container } = draw();

    expect(pagesIn(container).slice(0, 2)).toEqual(['p0', 'p3']);
  });

  it('turns the second page of the pair over, its back being the first page that arrives', () => {
    const { container } = draw();

    expect(pagesIn(container).slice(2)).toEqual(['p1', 'p2']);
  });

  it('mirrors it for a book read right to left, the leaf being on the other side', () => {
    const { container } = draw({ isRightToLeft: true });

    expect(pagesIn(container).slice(0, 2)).toEqual(['p3', 'p0']);
    expect(pagesIn(container).slice(2)).toEqual(['p1', 'p2']);
  });

  it('is the same leaf swung back, going the other way', () => {
    const { container } = draw({ isAdvancing: false, from: [2, 3], to: [0, 1] });

    expect(pagesIn(container).slice(0, 2)).toEqual(['p0', 'p3']);
    expect(pagesIn(container).slice(2)).toEqual(['p1', 'p2']);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PageTurn.displayName).toBe('PageTurn');
  });
});
