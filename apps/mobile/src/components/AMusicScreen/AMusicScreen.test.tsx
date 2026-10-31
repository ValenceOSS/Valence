import { Record } from '@keyline-icons/react-native';
import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AMusicScreen } from './AMusicScreen';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('AMusicScreen', () => {
  it('draws the cover edge to edge with its name, above the page', async () => {
    const drawn = await render(
      <AMusicScreen
        title="Even In Arcadia"
        artwork="http://one.local:8420/cover.jpg"
        standIn={Record}
        onBack={jest.fn()}
      >
        <Words>The tracks</Words>
      </AMusicScreen>,
      { wrapper: CacheScope },
    );

    expect(drawn.getAllByText('Even In Arcadia').length).toBeGreaterThan(0);
    expect(drawn.getByText('The tracks')).toBeTruthy();
    expect(JSON.stringify(drawn.toJSON())).toContain('http://one.local:8420/cover.jpg');
  });

  it('draws a mark for what it is where it has no cover', async () => {
    const drawn = await render(
      <AMusicScreen title="Liked songs" artwork={null} standIn={Record} onBack={jest.fn()}>
        <Words>The tracks</Words>
      </AMusicScreen>,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).not.toContain('cover.jpg');
    expect(drawn.getByText('The tracks')).toBeTruthy();
  });
});
