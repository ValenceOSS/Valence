import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FEEDBACK_EXAMPLES } from './FEEDBACK_EXAMPLES';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FEEDBACK_EXAMPLES', () => {
  it.each(
    Object.entries(FEEDBACK_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
