import { screen } from '@testing-library/react-native';
import { z } from 'zod';

const LabelsSchema = z.array(z.string());

/**
 * The choices a row of them offers, read from the system's segmented control the row is drawn as.
 *
 * @param row - What the row is called, as it is labelled for anyone who cannot see it.
 * @returns Its choices, in order.
 */
const theChoicesIn = (row: string): string[] =>
  LabelsSchema.parse(screen.getByLabelText(row).props.labels);

export { theChoicesIn };
