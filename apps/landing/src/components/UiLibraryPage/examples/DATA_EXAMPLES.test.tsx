import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DATA_EXAMPLES } from './DATA_EXAMPLES';

describe('DATA_EXAMPLES', () => {
  it.each(
    Object.entries(DATA_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
