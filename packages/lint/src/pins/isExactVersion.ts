const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

/**
 * Whether a dependency names one version, so nothing installs a different one until somebody
 * changes it here.
 *
 * A workspace package is always the one in the repository. A package from GitHub names a tag and is
 * held to one commit by the lockfile. An npm alias counts when the version after its name is exact.
 *
 * @param specifier - What package.json asks for.
 * @returns Whether it names exactly one version.
 */
const isExactVersion = (specifier: string): boolean => {
  if (specifier.startsWith('workspace:') || specifier.startsWith('github:')) {
    return true;
  }

  if (specifier.startsWith('npm:')) {
    return EXACT.test(specifier.slice(specifier.lastIndexOf('@') + 1));
  }

  return EXACT.test(specifier);
};

export { isExactVersion };
