import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LAYOUT_EXAMPLES } from './LAYOUT_EXAMPLES';

describe('LAYOUT_EXAMPLES', () => {
  it.each(
    Object.entries(LAYOUT_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
