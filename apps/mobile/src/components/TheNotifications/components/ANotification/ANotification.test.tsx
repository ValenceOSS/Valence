import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { ANotification } from './ANotification';

const NOTIFICATION = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  event: 'media.added',
  title: sayVerbatim('New episode of MobLand'),
  body: sayVerbatim('Season 2, episode 7'),
  link: null,
  createdAt: '2026-10-30T00:00:00.000Z',
  readAt: null,
} as const;

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ANotification', () => {
  it('says what happened and the line about it, and opens it', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <ANotification
        notification={NOTIFICATION}
        now={new Date('2026-10-30T12:00:00.000Z')}
        onPress={onPress}
      />,
    );

    expect(drawn.getByText('New episode of MobLand')).toBeTruthy();
    expect(drawn.getByText('Season 2, episode 7')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('New episode of MobLand'));

    expect(onPress).toHaveBeenCalled();
  });
});
