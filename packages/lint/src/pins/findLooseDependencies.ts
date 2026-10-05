import { z } from 'zod';
import { isExactVersion } from './isExactVersion';

const DependenciesSchema = z.record(z.string(), z.string()).optional();

const ManifestSchema = z.object({
  dependencies: DependenciesSchema,
  devDependencies: DependenciesSchema,
  optionalDependencies: DependenciesSchema,
});

/**
 * Lists the dependencies in a package.json that name a range rather than one version.
 *
 * Peer dependencies are left alone: a peer says which versions a package works with, and a range is
 * the right way to say that.
 *
 * @param packageJson - The text of a package.json.
 * @returns Each loose dependency, as `name@specifier`.
 */
const findLooseDependencies = (packageJson: string): string[] => {
  const { dependencies, devDependencies, optionalDependencies } = ManifestSchema.parse(
    JSON.parse(packageJson),
  );

  return [dependencies, devDependencies, optionalDependencies]
    .flatMap((declared) => Object.entries(declared ?? {}))
    .filter(([, specifier]) => !isExactVersion(specifier))
    .map(([name, specifier]) => `${name}@${specifier}`);
};

export { findLooseDependencies };
