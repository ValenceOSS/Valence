import { startFocusEngine } from '@ValenceTv/focus/startFocusEngine';
import { aLandingPlace } from '@ValenceTv/testing/aLandingPlace';

const box = (left: number) => ({ left, top: 0, right: left + 100, bottom: 100 });

const press = (key: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

  document.activeElement?.dispatchEvent(event);

  return event;
};

describe('startFocusEngine in a browser', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
    startFocusEngine();
    startFocusEngine();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('moves the remote with the arrows, rather than letting the page scroll', () => {
    aLandingPlace(document.body, 'first', box(0)).focus();
    aLandingPlace(document.body, 'second', box(120));

    expect(press('ArrowRight').defaultPrevented).toBe(true);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('second');
  });

  it('leaves left and right to a field being typed in', () => {
    const field = document.createElement('input');

    document.body.append(field);
    field.focus();

    expect(press('ArrowLeft').defaultPrevented).toBe(false);
  });

  it('turns the browser’s own focus outline off, once', () => {
    expect(
      [...document.head.querySelectorAll('style')].filter((style) =>
        style.textContent.includes('outline: none'),
      ),
    ).toHaveLength(1);
  });
});
