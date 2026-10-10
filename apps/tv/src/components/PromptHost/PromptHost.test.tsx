import { render } from '@testing-library/react-native';
import { PromptHost } from '@ValenceTv/components/PromptHost/PromptHost';

describe('PromptHost', () => {
  it('draws nothing on a television, which has alerts of its own', async () => {
    const drawn = await render(<PromptHost />);

    expect(drawn.toJSON()).toBeNull();
  });
});
