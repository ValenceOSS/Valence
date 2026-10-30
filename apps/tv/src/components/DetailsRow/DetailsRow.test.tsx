import { render } from '@testing-library/react-native';
import { DetailsRow } from '@ValenceTv/components/DetailsRow/DetailsRow';

describe('DetailsRow', () => {
  it('lists each fact under its name, beneath a heading', async () => {
    const drawn = await render(
      <DetailsRow
        details={[
          { label: 'Released', value: '15 July 2011' },
          { label: 'Budget', value: '$125M' },
        ]}
      />,
    );

    expect(drawn.getByText('Details')).toBeTruthy();
    expect(drawn.getByText('Released')).toBeTruthy();
    expect(drawn.getByText('15 July 2011')).toBeTruthy();
    expect(drawn.getByText('$125M')).toBeTruthy();
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('draws nothing where no fact is known', async () => {
    const drawn = await render(<DetailsRow details={[]} />);

    expect(drawn.queryByText('Details')).toBeNull();
  });
});
