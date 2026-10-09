import { act, fireEvent, render } from '@testing-library/react';
import { PromptHost } from '@ValenceTv/components/PromptHost/PromptHost';
import { askOnScreen, putThePromptAway } from '@ValenceTv/navigation/prompts';

afterEach(() => {
  act(() => {
    putThePromptAway();
  });
});

describe('PromptHost in a browser', () => {
  it('draws a question put on the screen, starting on the answer that changes nothing', () => {
    const drawn = render(<PromptHost />);

    act(() => {
      askOnScreen({
        title: 'Sign out the LG TV?',
        buttons: [
          { text: 'Keep it', style: 'cancel' },
          { text: 'Sign out', style: 'destructive' },
        ],
      });
    });

    expect(drawn.getByText('Sign out the LG TV?')).toBeTruthy();
    expect(document.activeElement).toBe(drawn.getByRole('button', { name: 'Keep it' }));
  });

  it('puts the question away and hands the remote back once it is answered', () => {
    const before = document.createElement('button');
    const signOut = jest.fn();

    document.body.append(before);
    before.focus();

    const drawn = render(<PromptHost />);

    act(() => {
      askOnScreen({
        title: 'Sign out the LG TV?',
        buttons: [
          { text: 'Keep it', style: 'cancel' },
          { text: 'Sign out', style: 'destructive', onPress: signOut },
        ],
      });
    });
    act(() => {
      fireEvent.click(drawn.getByRole('button', { name: 'Sign out' }));
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(drawn.queryByText('Sign out the LG TV?')).toBeNull();
    expect(document.activeElement).toBe(before);
  });
});
