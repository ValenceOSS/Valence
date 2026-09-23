import { render } from '@testing-library/react-native';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { chooseIn } from '@ValencePhone/testing/chooseIn';
import { theChoicesIn } from '@ValencePhone/testing/theChoicesIn';

const SIDES = [
  { id: 'discover', label: 'Discover' },
  { id: 'asked', label: 'Requested' },
];

describe('chooseIn and theChoicesIn', () => {
  it('reads the choices a row offers, and picks one by its words', async () => {
    const onSelect = jest.fn();

    await render(
      <SegmentedRow label="What to show" items={SIDES} value="discover" onSelect={onSelect} />,
    );

    expect(theChoicesIn('What to show')).toEqual(['Discover', 'Requested']);

    await chooseIn('What to show', 'Requested');

    expect(onSelect).toHaveBeenCalledWith('asked');
  });

  it('says so where a row offers no such choice', async () => {
    await render(
      <SegmentedRow label="What to show" items={SIDES} value="discover" onSelect={jest.fn()} />,
    );

    await expect(chooseIn('What to show', 'Nowhere')).rejects.toThrow(
      'What to show offers no Nowhere.',
    );
  });
});
