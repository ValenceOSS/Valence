import { render, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { ARequest } from './ARequest';

describe('ARequest', () => {
  it('names what was asked for, and when it is from', async () => {
    const drawn = await render(
      <ARequest request={aMediaRequest()} progress={[]} myId={null} onAsk={jest.fn()} />,
    );

    expect(drawn.getByText('Dune (2021)')).toBeTruthy();
  });

  it('says who asked, and says so plainly where it was you', async () => {
    const drawn = await render(
      <ARequest request={aMediaRequest()} progress={[]} myId="someone" onAsk={jest.fn()} />,
    );

    expect(drawn.getByText('Asked by you')).toBeTruthy();
  });

  it('names somebody else who asked', async () => {
    const drawn = await render(
      <ARequest request={aMediaRequest()} progress={[]} myId="me" onAsk={jest.fn()} />,
    );

    expect(drawn.getByText('Asked by Sam')).toBeTruthy();
  });

  it('shows how far a download has got', async () => {
    const drawn = await render(
      <ARequest
        request={aMediaRequest({
          state: 'downloading',
          items: [
            {
              id: '6ba7b810-9dad-11d1-80b4-00c04fd430d1',
              musicBrainzId: null,
              filePath: null,
              score: null,
              lastSearchedAt: null,
              updatedAt: '2026-09-19T00:00:00.000Z',
              season: null,
              episode: null,
              title: 'Dune',
              airDate: null,
              state: 'downloading',
              problem: null,
              problemCode: null,
              releaseTitle: null,
              downloadId: '6ba7b810-9dad-11d1-80b4-00c04fd430d2',
              downloadedBytes: null,
              downloadSeconds: null,
            },
          ],
        })}
        progress={[
          {
            downloadId: '6ba7b810-9dad-11d1-80b4-00c04fd430d2',
            state: 'downloading',
            progress: 0.5,
            sizeBytes: null,
            doneBytes: null,
            downloadBytesPerSecond: null,
            secondsLeft: null,
          },
        ]}
        myId={null}
        onAsk={jest.fn()}
      />,
    );

    expect(drawn.getByLabelText('How far Dune has downloaded')).toBeTruthy();
  });

  it('opens what explains its problem, where it has one', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const drawn = await render(
      <ARequest
        request={aMediaRequest({
          state: 'filing',
          problem: 'May not write to /media/Films',
          problemCode: 'MayNotWriteToLibrary',
        })}
        progress={[]}
        myId={null}
        onAsk={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByLabelText('How to fix this'));

    expect(open).toHaveBeenCalledWith(
      'https://docs.getvalence.app/install/requesting#who-owns-what-it-files',
    );
  });

  it('offers nothing to read where its problem has nowhere', async () => {
    const drawn = await render(
      <ARequest request={aMediaRequest()} progress={[]} myId={null} onAsk={jest.fn()} />,
    );

    expect(drawn.queryByLabelText('How to fix this')).toBeNull();
  });

  it('opens its page by the catalogue id', async () => {
    const onAsk = jest.fn();
    const drawn = await render(
      <ARequest request={aMediaRequest()} progress={[]} myId={null} onAsk={onAsk} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onAsk).toHaveBeenCalledWith('film', '438631');
  });
});
