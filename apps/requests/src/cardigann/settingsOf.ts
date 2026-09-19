import type {
  CardigannDefinition,
  CardigannSetting,
} from '@ValenceRequests/cardigann/CardigannDefinitionSchema';

const SIGN_IN: readonly CardigannSetting[] = [
  { name: 'username', type: 'text', label: 'Username' },
  { name: 'password', type: 'password', label: 'Password' },
];

/**
 * The settings a definition asks for: its own, or a username and password where it names none,
 * which is what the format means by leaving them out. `settings: []` asks for nothing.
 *
 * @param definition - The definition.
 * @returns Its settings.
 */
const settingsOf = (definition: CardigannDefinition): readonly CardigannSetting[] =>
  definition.settings ?? SIGN_IN;

export { settingsOf };
