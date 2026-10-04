const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

const FIXED_GIT_REF = /#(?:[0-9a-f]{40}|v?\d+\.\d+\.\d+[^\s&]*)(?:&|$)/u;

/**
 * Whether a dependency names one version, so nothing installs a different one until somebody
 * changes it here.
 *
 * A workspace package is always the one in the repository. A package from git counts when it names a
 * commit or a version tag, which the lockfile holds to one commit, and not a branch, which moves. An
 * npm alias counts when the version after its name is exact.
 *
 * @param specifier - What package.json asks for.
 * @returns Whether it names exactly one version.
 */
const isExactVersion = (specifier: string): boolean => {
  if (specifier.startsWith('workspace:')) {
    return true;
  }

  if (specifier.startsWith('github:') || specifier.startsWith('git+')) {
    return FIXED_GIT_REF.test(specifier);
  }

  if (specifier.startsWith('npm:')) {
    return EXACT.test(specifier.slice(specifier.lastIndexOf('@') + 1));
  }

  return EXACT.test(specifier);
};

export { isExactVersion };
