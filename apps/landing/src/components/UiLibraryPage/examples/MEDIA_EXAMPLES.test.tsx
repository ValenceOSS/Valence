import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEDIA_EXAMPLES } from './MEDIA_EXAMPLES';

beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'textTracks', {
    configurable: true,
    value: Object.assign([], { addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

describe('MEDIA_EXAMPLES', () => {
  it.each(
    Object.entries(MEDIA_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
