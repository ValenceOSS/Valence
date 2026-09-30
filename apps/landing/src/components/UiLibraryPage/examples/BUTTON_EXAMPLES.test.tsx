import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BUTTON_EXAMPLES } from './BUTTON_EXAMPLES';

describe('BUTTON_EXAMPLES', () => {
  it.each(
    Object.entries(BUTTON_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
