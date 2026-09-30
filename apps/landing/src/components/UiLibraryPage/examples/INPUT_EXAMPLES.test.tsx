import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { INPUT_EXAMPLES } from './INPUT_EXAMPLES';

describe('INPUT_EXAMPLES', () => {
  it.each(
    Object.entries(INPUT_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
