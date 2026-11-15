import { fireEvent, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { useArtworkSize } from '@ValenceMobile/hooks/useArtworkSize';
import { ATitleLogo } from './ATitleLogo';

jest.mock('@ValenceMobile/hooks/useArtworkSize', () => ({
  useArtworkSize: jest.fn(() => 'medium'),
}));

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(useArtworkSize).mockReturnValue('medium');
});

describe('ATitleLogo', () => {
  it('draws the title’s logo narrowed to the widest it may be, named for who cannot see it', async () => {
    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    expect(useArtworkSize).toHaveBeenCalledWith(300);
    expect(drawn.getByLabelText('Arrival').props.source).toEqual({
      uri: 'http://one.local:8420/api/media/arrival/image/logo?size=medium',
    });
  });

  it('asks for the whole logo where no narrowed copy would do', async () => {
    jest.mocked(useArtworkSize).mockReturnValue('whole');

    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    expect(drawn.getByLabelText('Arrival').props.source).toEqual({
      uri: 'http://one.local:8420/api/media/arrival/image/logo',
    });
  });

  it('asks for no logo, and writes nothing out, until it knows which copy to ask for', async () => {
    jest.mocked(useArtworkSize).mockReturnValue(null);

    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    expect(drawn.queryByLabelText('Arrival')).toBeNull();
    expect(drawn.queryByText('Arrival')).toBeNull();
  });

  it('draws lettering from where it is given, for something the library does not hold', async () => {
    const drawn = await render(
      <ATitleLogo
        mediaId={null}
        uri="http://one.local:8420/api/requests/picture/logo.png"
        title="Arrival"
        high={60}
        widest={300}
      />,
    );

    expect(drawn.getByLabelText('Arrival').props.source).toEqual({
      uri: 'http://one.local:8420/api/requests/picture/logo.png',
    });
  });

  it('writes the title out where there is no logo', async () => {
    const drawn = await render(
      <ATitleLogo mediaId={null} title="Arrival" high={60} widest={300} />,
    );

    expect(drawn.getByText('Arrival')).toHaveStyle({ textAlign: 'center' });
  });

  it('sets the title out from the left where it is asked to', async () => {
    const drawn = await render(
      <ATitleLogo mediaId={null} title="Arrival" high={60} widest={300} isCentred={false} />,
    );

    expect(drawn.getByText('Arrival')).not.toHaveStyle({ textAlign: 'center' });
  });

  it('tries the lettering of the next title, after one that would not load', async () => {
    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    await fireEvent(drawn.getByLabelText('Arrival'), 'error');
    await drawn.rerender(<ATitleLogo mediaId="dune" title="Dune" high={60} widest={300} />);

    expect(drawn.getByLabelText('Dune').props.source).toEqual({
      uri: 'http://one.local:8420/api/media/dune/image/logo?size=medium',
    });
  });

  it('writes the title out where the logo will not load', async () => {
    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    await fireEvent(drawn.getByLabelText('Arrival'), 'error');

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });
});
