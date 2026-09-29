import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ANoticeBlock } from './ANoticeBlock';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('ANoticeBlock', () => {
  it('says a warning as an alert, with its title', async () => {
    const drawn = await render(
      <ANoticeBlock tone="danger" title="It failed" text="Try again later." />,
    );

    expect(drawn.getByRole('alert')).toBeTruthy();
    expect(drawn.getByText('It failed')).toBeTruthy();
    expect(drawn.getByText('Try again later.')).toBeTruthy();
  });

  it('says a note as a summary', async () => {
    const drawn = await render(<ANoticeBlock tone="success" text="Imported." />);

    expect(drawn.getByRole('summary')).toBeTruthy();
  });
});
