import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { readBuiltOn } from './readBuiltOn';
import { readComponentDocs } from './readComponentDocs';
import type { UiComponentDoc } from './uiCatalogue.types';

const PathsSchema = z.object({
  compilerOptions: z.object({ paths: z.record(z.string(), z.array(z.string())) }),
});

const COMPONENT_ALIAS = /^@ValenceUI\/(?<name>[A-Z][A-Za-z]*)$/u;

const COMPONENT_PATH =
  /^\.\/packages\/ui\/src\/components\/(?<folder>[A-Za-z]+)\/(?<file>[A-Za-z]+)\.tsx$/u;

/**
 * Lists every ValenceUI component the repository names with an alias of its own, and reads what
 * each documents about itself, so the landing's UI library shows exactly the components there are.
 *
 * @param root - The repository's root folder.
 * @returns The components, in alphabetical order.
 */
const buildUiCatalogue = (root: string): UiComponentDoc[] => {
  const { paths } = PathsSchema.parse(
    JSON.parse(readFileSync(join(root, 'tsconfig.paths.json'), 'utf8')),
  ).compilerOptions;

  return Object.entries(paths)
    .flatMap(([alias, [target]]) => {
      const name = COMPONENT_ALIAS.exec(alias)?.groups?.name;
      const place = target === undefined ? null : COMPONENT_PATH.exec(target)?.groups;

      if (name === undefined || place === undefined || place === null || place.file !== name) {
        return [];
      }

      const folder = join(root, 'packages/ui/src/components', place.folder ?? name);
      const typesPath = join(folder, `${name}.types.ts`);

      const ownFiles = readdirSync(folder)
        .filter((file) => /\.tsx?$/u.test(file) && !/\.test\.tsx?$/u.test(file))
        .sort((one, other) =>
          one === `${name}.tsx` ? -1 : other === `${name}.tsx` ? 1 : one.localeCompare(other),
        )
        .map((file) => readFileSync(join(folder, file), 'utf8'));

      return [
        {
          ...readComponentDocs(
            name,
            readFileSync(join(folder, `${name}.tsx`), 'utf8'),
            existsSync(typesPath) ? readFileSync(typesPath, 'utf8') : null,
          ),
          builtOn: readBuiltOn(ownFiles),
        },
      ];
    })
    .sort((one, other) => one.name.localeCompare(other.name));
};

export { buildUiCatalogue };
