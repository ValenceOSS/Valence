import type {
  CardigannDefinition,
  CardigannSetting,
} from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import { say } from '@ValenceI18n/say';

const SIGN_IN: readonly CardigannSetting[] = [
  { name: 'username', type: 'text', label: say('common.username') },
  { name: 'password', type: 'password', label: say('common.password') },
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
