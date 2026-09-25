import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { AFeature } from './AFeature';

describe('AFeature', () => {
  it('plays the title featured, and opens more about it', async () => {
    installPlatform(aFakePlatform());
    const onPlay = jest.fn();
    const onMoreInfo = jest.fn();
    const drawn = await render(
      <AFeature
        media={aTitle()}
        width={390}
        isShowing={false}
        resumeAt={null}
        onEnded={jest.fn()}
        onPlay={onPlay}
        onMoreInfo={onMoreInfo}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByText('Play'));
    await userEvent.press(drawn.getByRole('button', { name: 'More info' }));

    expect(onPlay).toHaveBeenCalled();
    expect(onMoreInfo).toHaveBeenCalled();
  });
});
