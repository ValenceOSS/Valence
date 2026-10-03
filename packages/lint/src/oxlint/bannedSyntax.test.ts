import { aRuleTester } from './aRuleTester';
import { bannedSyntax } from './bannedSyntax';

const NO_AS = {
  selector: 'TSAsExpression[typeAnnotation.typeName.name!="const"]',
  message: 'No as.',
};

const NO_BUTTON = { selector: 'JSXOpeningElement[name.name="button"]', message: 'No buttons.' };

const NO_RAW_CONTROLS = {
  selector: 'JSXOpeningElement[name.name=/^(button|input|dialog)$/]',
  message: 'No raw controls.',
};

const NO_UNKNOWN = { selector: 'TSUnknownKeyword', message: 'No unknown.' };

aRuleTester().run('banned-syntax', bannedSyntax, {
  valid: [
    { code: 'const rows = [1, 2] as const;', options: [NO_AS] },
    { code: 'const it = <Button />;', options: [NO_BUTTON] },
    { code: 'const it = 1 as number;', options: [NO_BUTTON] },
    { code: 'const it = <Dialog />;', options: [NO_RAW_CONTROLS] },
  ],
  invalid: [
    {
      code: 'const it = <><input /><dialog /></>;',
      options: [NO_RAW_CONTROLS],
      errors: [{ message: 'No raw controls.' }, { message: 'No raw controls.' }],
    },
    { code: 'const it = 1 as number;', options: [NO_AS], errors: [{ message: 'No as.' }] },
    { code: 'const it = <button />;', options: [NO_BUTTON], errors: [{ message: 'No buttons.' }] },
    {
      code: 'const it = (thing: unknown) => <button>{thing as string}</button>;',
      options: [NO_AS, NO_BUTTON, NO_UNKNOWN],
      errors: [{ message: 'No unknown.' }, { message: 'No buttons.' }, { message: 'No as.' }],
    },
    {
      code: 'const it = 1 as number;',
      options: [NO_AS, { ...NO_AS, message: 'Still no as.' }],
      errors: [{ message: 'No as.' }, { message: 'Still no as.' }],
    },
  ],
});
