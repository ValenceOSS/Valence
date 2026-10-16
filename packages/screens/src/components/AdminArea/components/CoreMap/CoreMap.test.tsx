import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoreMap } from './CoreMap';

describe('CoreMap', () => {
  it('draws a tile for each core, saying how busy it is', () => {
    render(<CoreMap cores={2} threads={4} groups={[]} percents={[10, 30, 50, 70]} />);

    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('reads out how many cores and threads there are', () => {
    render(<CoreMap cores={2} threads={4} groups={[]} percents={[]} />);

    expect(screen.getByRole('img')).toHaveAccessibleName('2 cores running 4 threads');
  });

  it('says nothing about how busy a core is before the first reading', () => {
    render(<CoreMap cores={1} threads={1} groups={[]} percents={[]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('labels each kind of core and draws each thread on the core it runs on', () => {
    render(
      <CoreMap
        cores={3}
        threads={3}
        groups={[
          { kind: 'performance', name: 'Super', cores: [[2]] },
          { kind: 'efficiency', name: null, cores: [[0], [1]] },
        ]}
        percents={[5, 15, 90]}
      />,
    );

    expect(screen.getByText('Super')).toBeInTheDocument();
    expect(screen.getByText('Efficiency cores')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('leaves out the label where every core is alike', () => {
    render(
      <CoreMap
        cores={1}
        threads={1}
        groups={[{ kind: 'other', name: null, cores: [[0]] }]}
        percents={[0]}
      />,
    );

    expect(screen.queryByText('Cores')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CoreMap.displayName).toBe('CoreMap');
  });
});
