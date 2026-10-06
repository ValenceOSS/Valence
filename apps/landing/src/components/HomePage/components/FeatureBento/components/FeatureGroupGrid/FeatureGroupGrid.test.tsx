import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features';
import { FeatureGroupGrid } from './FeatureGroupGrid';

const FOUR = FEATURE_GROUPS.find((group) => group.features.length === 4);
const THREE = FEATURE_GROUPS.find((group) => group.features.length === 3);

describe('FeatureGroupGrid', () => {
  it('numbers and names the group, says what it is for, and lists its features', () => {
    if (FOUR === undefined) {
      throw new Error('A group of four features is needed');
    }

    render(<FeatureGroupGrid group={FOUR} number={2} />);

    const region = screen.getByRole('region', { name: FOUR.title });

    expect(within(region).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent(
      `02${FOUR.title}`,
    );
    expect(within(region).getByText(FOUR.detail)).toBeInTheDocument();
    expect(within(region).getAllByRole('article')).toHaveLength(4);
  });

  it('sets four across on a wide screen, and three across for a group of three', () => {
    if (FOUR === undefined || THREE === undefined) {
      throw new Error('Groups of four and three features are needed');
    }

    const { unmount } = render(<FeatureGroupGrid group={FOUR} number={1} />);

    expect(screen.getByRole('list')).toHaveClass('2xl:grid-cols-4');
    unmount();

    render(<FeatureGroupGrid group={THREE} number={1} />);

    expect(screen.getByRole('list')).toHaveClass('lg:grid-cols-3');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureGroupGrid.displayName).toBe('FeatureGroupGrid');
  });
});
