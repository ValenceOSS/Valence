import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HowToFix } from './HowToFix';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HowToFix', () => {
  it('opens the section of the docs about the problem, apart from Valence', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    render(<HowToFix href="https://docs.getvalence.app/install/requesting#failing-indexers" />);
    await userEvent.click(screen.getByRole('button', { name: 'How to fix this' }));

    expect(open).toHaveBeenCalledWith(
      'https://docs.getvalence.app/install/requesting#failing-indexers',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('says nothing where no section explains the problem', () => {
    const { container } = render(<HowToFix href={null} />);

    expect(container).toBeEmptyDOMElement();
    expect(render(<HowToFix href={undefined} />).container).toBeEmptyDOMElement();
  });
});
