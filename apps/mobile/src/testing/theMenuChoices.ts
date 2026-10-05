import { theMenu } from '@ValenceMobile/testing/theMenu';

/**
 * What a system pop-up menu offers, in the order it offers it.
 *
 * @param label - What the menu chooses.
 * @returns The name of every choice.
 */
const theMenuChoices = (label: string): string[] =>
  theMenu(label)
    .queryAll((one) => typeof one.props.text === 'string')
    .map((one) => String(one.props.text));

export { theMenuChoices };
