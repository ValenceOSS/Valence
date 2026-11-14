import { definePlugin } from '@oxlint/plugins';
import { bannedSyntax } from './bannedSyntax';
import { logicalSides } from './logicalSides';
import { neutralQueries } from './neutralQueries';
import { noComments } from './noComments';
import { noHardCodedStrings } from './noHardCodedStrings';
import { noRawColours } from './noRawColours';

const valencePlugin = definePlugin({
  meta: { name: 'valence' },
  rules: {
    'banned-syntax': bannedSyntax,
    'logical-sides': logicalSides,
    'neutral-queries': neutralQueries,
    'no-comments': noComments,
    'no-hard-coded-strings': noHardCodedStrings,
    'no-raw-colours': noRawColours,
  },
});

export { valencePlugin };
