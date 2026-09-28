import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AnArtCard } from './AnArtCard';

const thePictures = () => theDrawnRoot().queryAll((node) => node.type === 'Image');

describe('AnArtCard', () => {
  it('draws the backdrop with the title’s logo in it rather than its name', async () => {
    const drawn = await render(
      <AnArtCard
        title="Arrival"
        artwork="http://one.local/backdrop"
        logo="http://one.local/logo"
      />,
    );

    expect(thePictures()).toHaveLength(2);
    expect(drawn.queryByText('Arrival')).toBeNull();
  });

  it('writes the name into the picture where there is no logo', async () => {
    const drawn = await render(
      <AnArtCard title="Arrival" artwork="http://one.local/backdrop" logo={null} />,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('writes the name in where the logo cannot be read', async () => {
    const drawn = await render(
      <AnArtCard
        title="Arrival"
        artwork="http://one.local/backdrop"
        logo="http://one.local/logo"
      />,
    );

    const logo = thePictures()[1];

    if (logo === undefined) {
      throw new Error('No logo was drawn.');
    }

    await fireEvent(logo, 'error');

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('flags what is new about it', async () => {
    const drawn = await render(
      <AnArtCard title="Arrival" artwork={null} logo={null} flag="Recently added" />,
    );

    expect(drawn.getByText('Recently added')).toBeTruthy();
  });

  it('says how far through it somebody is while they are part way', async () => {
    const drawn = await render(
      <AnArtCard title="Arrival" artwork={null} logo={null} watched={0.4} />,
    );

    expect(drawn.getByLabelText('How far through Arrival')).toBeTruthy();
  });

  it('draws no line once it has been watched through', async () => {
    const drawn = await render(
      <AnArtCard title="Arrival" artwork={null} logo={null} watched={1} />,
    );

    expect(drawn.queryByLabelText('How far through Arrival')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnArtCard.displayName).toBe('AnArtCard');
  });
});
