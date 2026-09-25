import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noHardCodedStrings } from './noHardCodedStrings';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
});

ruleTester.run('no-hard-coded-strings', noHardCodedStrings, {
  valid: [
    { code: "const it = say('offline.heading');" },
    { code: "import { say } from '@ValenceI18n/say';" },
    { code: 'const it = <p className="flex items-center gap-2">{say(\'a.b\')}</p>;' },
    { code: "const it = cn('relative flex h-9', isOn && 'text-text');" },
    { code: "const it = 'valence-rail relative isolate flex w-fit items-center';" },
    { code: "const it = { label: 'px-3 py-1.5 text-xs uppercase tracking-[0.14em]' };" },
    { code: "Thing.displayName = 'Thing';" },
    { code: "console.error('Something went wrong here');" },
    { code: "log.info('The scan finished');" },
    { code: "process.stdout.write('Restoring the database');" },
    { code: "throw new Error('That should never happen');" },
    { code: "if (kind === 'Films') {}" },
    { code: "switch (x) { case 'Some Thing': break; }" },
    { code: "type Kind = 'Some Thing';" },
    { code: "const it = { code: 'ClientSupportsSource' };" },
    { code: "const it = 'RefFramesNotSupported';" },
    { code: 'const it = `series:${key}`;' },
    { code: "const it = 'https:';" },
    { code: "const it = headers.get('Content-Type');" },
    { code: "const it = line.startsWith('Format:');" },
    { code: "const it = { id: 'Films' };" },
    { code: "const it = 'here';" },
    { code: 'const it = <View testID="Main screen" />;' },
    { filename: 'a/b/Thing.test.tsx', code: 'const it = <p>Hello there</p>;' },
    { filename: 'apps/server/src/routes/MusicRoute.ts', code: "const it = 'Not signed in';" },
  ],
  invalid: [
    { code: 'const it = <p>On this device</p>;', errors: [{ messageId: 'words' }] },
    { code: 'const it = <Button label="Delete" />;', errors: [{ messageId: 'words' }] },
    { code: "const it = <Field placeholder={'search'} />;", errors: [{ messageId: 'words' }] },
    { code: "const it = { label: 'Films' };", errors: [{ messageId: 'words' }] },
    { code: "const it = { error: 'Nobody is signed in.' };", errors: [{ messageId: 'words' }] },
    { code: "const it = 'Skip Intro';", errors: [{ messageId: 'words' }] },
    { code: "const it = 'Unknown';", errors: [{ messageId: 'words' }] },
    { code: "const it = 'it disappears.';", errors: [{ messageId: 'words' }] },
    { code: "const it = 'at some point';", errors: [{ messageId: 'words' }] },
    {
      code: 'const it = `${count.toString()} min ago`;',
      errors: [{ messageId: 'words' }],
    },
    {
      code: 'const it = <Rail label={`Forward a page of ${title}`} />;',
      errors: [{ messageId: 'words' }],
    },
    {
      code: "const it = isOn ? 'Switch off' : 'Switch on';",
      errors: [{ messageId: 'words' }, { messageId: 'words' }],
    },
    { code: "const it = 'Hello ' + name;", errors: [{ messageId: 'words' }] },
  ],
});
