import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TitleDetails } from './TitleDetails';

describe('TitleDetails', () => {
  it('states when it came out, where it stands, and what it cost and took', () => {
    render(
      <TitleDetails
        releaseDate="2021-09-15"
        status="Post Production"
        budget={165_000_000}
        revenue={402_000_000}
      />,
    );

    expect(screen.getByText('15 Sept 2021')).toBeInTheDocument();
    expect(screen.getByText('Post Production')).toBeInTheDocument();
    expect(screen.getByText('$165M')).toBeInTheDocument();
    expect(screen.getByText('$402M')).toBeInTheDocument();
  });

  it('shows only what is known', () => {
    render(<TitleDetails status="Returning Series" />);

    expect(screen.getByText('Returning Series')).toBeInTheDocument();
    expect(screen.queryByText('Budget')).not.toBeInTheDocument();
    expect(screen.queryByText('Released')).not.toBeInTheDocument();
  });

  it('draws nothing where nothing is known, or where money is given as nought', () => {
    const { container } = render(<TitleDetails budget={0} revenue={null} releaseDate="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleDetails.displayName).toBe('TitleDetails');
  });
});
