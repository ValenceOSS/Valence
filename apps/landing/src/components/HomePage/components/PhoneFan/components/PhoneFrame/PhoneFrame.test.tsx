import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhoneFrame } from './PhoneFrame';

describe('PhoneFrame', () => {
  it('shows the screenshot inside the iPhone of the finish asked for', () => {
    const { container } = render(
      <PhoneFrame label="Now playing" src="/phones/playing.jpg" finish="blue" />,
    );

    expect(screen.getByRole('img', { name: 'Now playing' })).toHaveAttribute(
      'src',
      '/phones/playing.jpg',
    );
    expect(container.querySelector('img[src="/devices/iphone-blue.png"]')).not.toBeNull();
  });

  it('draws a stand-in screen, named for what it will show, until there is a screenshot', () => {
    render(<PhoneFrame label="A book" />);

    expect(screen.getByRole('img', { name: 'A book' })).toHaveTextContent('A book');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PhoneFrame.displayName).toBe('PhoneFrame');
  });
});
