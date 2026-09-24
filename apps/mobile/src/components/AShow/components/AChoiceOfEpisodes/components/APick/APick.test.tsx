import { render } from '@testing-library/react-native';
import { APick } from './APick';

describe('APick', () => {
  it('draws an empty box where nothing is picked', async () => {
    const drawn = await render(<APick standing="none" />);

    expect(drawn.toJSON()).toBeTruthy();
  });

  it('draws a tick where everything is picked, and a dash where some is', async () => {
    const all = await render(<APick standing="all" />);
    const some = await render(<APick standing="some" />);

    expect(JSON.stringify(all.toJSON())).not.toBe(JSON.stringify(some.toJSON()));
  });
});
