import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { pickFromAMenu } from '@ValenceMobile/testing/pickFromAMenu';
import { AMenu } from './AMenu';

const items = (onHide = jest.fn()) => [
  {
    id: 'watched',
    label: 'Mark as watched',
    symbol: 'checkmark.circle' as const,
    onChoose: jest.fn(),
  },
  {
    id: 'hide',
    label: 'Hide',
    symbol: 'eye.slash' as const,
    startsAGroup: true,
    isDestructive: true,
    onChoose: onHide,
  },
];

describe('AMenu', () => {
  it('opens from what it holds, named for anybody who cannot see it', async () => {
    const drawn = await render(
      <AMenu label="More" items={items()}>
        <Text>More</Text>
      </AMenu>,
    );

    expect(drawn.getByRole('button', { name: 'More' })).toBeTruthy();
  });

  it('does the item picked', async () => {
    const onHide = jest.fn();

    await render(
      <AMenu label="More" items={items(onHide)}>
        <Text>More</Text>
      </AMenu>,
    );

    await pickFromAMenu('Hide');

    expect(onHide).toHaveBeenCalled();
  });

  it('draws an item that removes something as the system draws one', async () => {
    const drawn = await render(
      <AMenu label="More" items={items()}>
        <Text>More</Text>
      </AMenu>,
    );

    const [hide] = drawn.container.queryAll(
      (one) => 'onButtonPress' in one.props && one.props.label === 'Hide',
    );

    expect(hide?.props.role).toBe('destructive');
  });
});
