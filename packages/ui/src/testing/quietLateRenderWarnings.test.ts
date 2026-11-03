import { describe, expect, it, vi } from 'vitest';
import { quietLateRenderWarnings } from './quietLateRenderWarnings';

const aConsole = () => {
  const said = vi.fn();

  return { said, console: { error: said } };
};

describe('quietLateRenderWarnings', () => {
  it('keeps React’s warning about an update outside act() off the console', () => {
    const { said, console } = aConsole();

    quietLateRenderWarnings(console);
    console.error(
      'An update to %s inside a test was not wrapped in act(...).\n\nWhen testing, code that causes React state updates should be wrapped into act(...)',
      'NavBar',
    );

    expect(said).not.toHaveBeenCalled();
  });

  it('lets every other error through as it was said', () => {
    const { said, console } = aConsole();
    const failure = new Error('the page could not be read');

    quietLateRenderWarnings(console);
    console.error('Something went wrong:', failure);
    console.error(failure);

    expect(said).toHaveBeenNthCalledWith(1, 'Something went wrong:', failure);
    expect(said).toHaveBeenNthCalledWith(2, failure);
  });
});
