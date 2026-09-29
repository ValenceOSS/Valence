import { render } from '@testing-library/react-native';
import { PluginNotice } from '@ValenceTv/components/PluginSurface/components/PluginNotice/PluginNotice';

describe('PluginNotice', () => {
  it('says a failure as an alert, with its title', async () => {
    const drawn = await render(
      <PluginNotice tone="danger" title="It failed" text="Try again later." />,
    );

    expect(drawn.getByRole('alert')).toBeTruthy();
    expect(drawn.getByText('It failed')).toBeTruthy();
  });

  it('says a success as a summary', async () => {
    const drawn = await render(<PluginNotice tone="success" text="Imported." />);

    expect(drawn.getByRole('summary')).toBeTruthy();
  });
});
