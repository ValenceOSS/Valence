type PromptButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type Prompt = {
  title: string;
  message?: string;
  buttons: readonly PromptButton[];
};

const listeners = new Set<(prompt: Prompt | null) => void>();

let showing: Prompt | null = null;

/**
 * Puts a question on the screen, in place of any already there.
 *
 * @param prompt - What is asked, and the answers.
 */
const askOnScreen = (prompt: Prompt): void => {
  showing = prompt;

  for (const listener of listeners) {
    listener(showing);
  }
};

/**
 * Takes the question off the screen.
 */
const putThePromptAway = (): void => {
  showing = null;

  for (const listener of listeners) {
    listener(null);
  }
};

/**
 * Hears every question put on the screen and taken away, starting with whatever is there now.
 *
 * @param listener - Told the question showing, or nothing.
 * @returns The way to stop hearing.
 */
const whenPrompted = (listener: (prompt: Prompt | null) => void): (() => void) => {
  listeners.add(listener);
  listener(showing);

  return () => {
    listeners.delete(listener);
  };
};

export type { Prompt, PromptButton };

export { askOnScreen, putThePromptAway, whenPrompted };
