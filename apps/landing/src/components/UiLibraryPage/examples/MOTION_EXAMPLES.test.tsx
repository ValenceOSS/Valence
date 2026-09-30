import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MOTION_EXAMPLES } from './MOTION_EXAMPLES';

describe('MOTION_EXAMPLES', () => {
  it.each(
    Object.entries(MOTION_EXAMPLES).flatMap(([name, examples]) =>
      examples.map((example): [string, typeof example] => [`${name}: ${example.title}`, example]),
    ),
  )('draws %s', (_, example) => {
    const { container } = render(<>{example.render()}</>);

    expect(container).not.toBeEmptyDOMElement();
  });
});
