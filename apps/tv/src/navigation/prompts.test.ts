import { askOnScreen, putThePromptAway, whenPrompted } from '@ValenceTv/navigation/prompts';

describe('prompts', () => {
  afterEach(() => {
    putThePromptAway();
  });

  it('tells a listener what is on the screen at once, and each change after, until it stops', () => {
    const heard: (string | null)[] = [];
    const stop = whenPrompted((prompt) => {
      heard.push(prompt?.title ?? null);
    });

    askOnScreen({ title: 'Sure?', buttons: [{ text: 'Yes' }] });
    putThePromptAway();
    stop();
    askOnScreen({ title: 'Again?', buttons: [{ text: 'Yes' }] });

    expect(heard).toEqual([null, 'Sure?', null]);
  });
});
