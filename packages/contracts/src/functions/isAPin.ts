import { PinSchema } from '@ValenceContracts/schemas/ProfilePin';

/**
 * Whether something typed could be a profile's PIN: four to eight digits, as the server keeps them.
 *
 * @param typed - What was typed.
 * @returns Whether it is shaped like a PIN.
 */
const isAPin = (typed: string): boolean => PinSchema.safeParse(typed).success;

export { isAPin };
