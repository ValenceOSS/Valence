import { render, userEvent } from '@testing-library/react-native';
import { fetchMediaDetail } from '@ValenceClient/library/fetchLibrary';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AFeature } from './AFeature';

jest.mock('@ValenceClient/library/fetchLibrary');

const ABOUT = 'Linguists meet a ship.';

/**
 * The featured title's logo, as it was drawn.
 *
 * @returns Where it was drawn.
 */
const theLogo = () => {
  const [logo] = theDrawnRoot().queryAll(
    (one) => one.type === 'Image' && one.props.accessibilityLabel === 'Arrival',
  );

  if (logo === undefined) {
    throw new Error('No logo was drawn.');
  }

  return logo;
};

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest
    .mocked(fetchMediaDetail)
    .mockReset()
    .mockResolvedValue(
      MediaDetailSchema.parse({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        title: 'Arrival',
        year: 2016,
        container: 'mkv',
        durationSeconds: 6960,
        videoCodec: 'hevc',
        videoRange: 'SDR',
        width: 3840,
        height: 2160,
        bitrateKbps: 12000,
        audioStreams: [],
        subtitleStreams: [],
        addedAt: '2026-01-01T00:00:00.000Z',
        metadata: {
          overview: ABOUT,
          certification: '15',
          certificationRegion: 'GB',
          hasPoster: true,
          hasBackdrop: false,
          hasLogo: true,
        },
      }),
    );
});

describe('AFeature', () => {
  it('plays the title featured, and opens more about it', async () => {
    const onPlay = jest.fn();
    const onMoreInfo = jest.fn();
    const drawn = await render(
      <AFeature
        media={aTitle()}
        width={390}
        height={507}
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

  it('says a few lines about it, with its logo at full height and More info in words', async () => {
    const drawn = await render(
      <AFeature
        media={aTitle({ hasLogo: true })}
        width={390}
        height={507}
        isShowing={false}
        resumeAt={null}
        onEnded={jest.fn()}
        onPlay={jest.fn()}
        onMoreInfo={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText(ABOUT)).toBeTruthy();
    expect(drawn.getByText('More info')).toBeTruthy();
    expect(theLogo()).toHaveStyle({ height: 76 });
  });

  it('leaves the lines out, shortens its logo and keeps More info to its icon on a narrow card', async () => {
    const onMoreInfo = jest.fn();
    const drawn = await render(
      <AFeature
        media={aTitle({ hasLogo: true })}
        width={300}
        height={420}
        isShowing={false}
        resumeAt={null}
        onEnded={jest.fn()}
        onPlay={jest.fn()}
        onMoreInfo={onMoreInfo}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByLabelText('Rated 15 by the BBFC')).toBeTruthy();
    expect(drawn.queryByText(ABOUT)).toBeNull();
    expect(drawn.queryByText('More info')).toBeNull();
    expect(theLogo()).toHaveStyle({ height: 52 });

    await userEvent.press(drawn.getByRole('button', { name: 'More info' }));

    expect(onMoreInfo).toHaveBeenCalled();
  });
});
