import { afterEach, describe, expect, it } from 'vitest';
import { heldBelow } from './heldBelow';

/**
 * An element laid out between two heights, with no edge of its own, as jsdom never lays anything
 * out itself and reads an edge nobody set as 16px.
 */
const placed = (top: number, bottom: number, position = 'static') => {
  const element = document.createElement('div');

  element.style.position = position;
  element.style.borderBottomWidth = '0';
  element.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: 0, y: top, width: 400, height: bottom - top });

  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('heldBelow', () => {
  it('adds up what sits beneath an element on its way out to the page', () => {
    const page = placed(0, 340);
    const content = placed(0, 300);
    const box = placed(100, 300);
    const footer = placed(300, 340);

    content.append(box);
    page.append(content, footer);
    document.body.append(page);

    expect(heldBelow(box)).toBe(40);
  });

  it('counts nothing floating over the page, such as a bar pinned to the foot of a phone', () => {
    const page = placed(0, 340);
    const content = placed(0, 300);
    const box = placed(100, 300);
    const footer = placed(300, 340);
    const bar = placed(800, 870, 'fixed');
    const badge = placed(500, 520, 'absolute');

    content.append(box);
    page.append(content, footer, bar, badge);
    document.body.append(page);

    expect(heldBelow(box)).toBe(40);
  });

  it('counts nothing beside an element, such as a sidebar', () => {
    const page = placed(0, 300);
    const sidebar = placed(0, 900);
    const box = placed(100, 300);

    page.append(sidebar, box);
    document.body.append(page);
    sidebar.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 240, height: 900 });

    expect(heldBelow(box)).toBe(0);
  });
});
