type AResolving = {
  basedir: string;
  extensions?: readonly string[];
  defaultResolver: (request: string, options: AResolving) => string;
};

const DRAWN_AS_ON_THE_WEB_IN_JEST = [
  'initializers',
  'mutables',
  'mappers',
  'ConfigHelper',
  'UpdateLayoutAnimations',
  'useAnimatedRef',
  'useAnimatedStyle',
  'WorkletEventHandler',
  'JSPropsUpdater',
  'updateProps',
  'util',
  'css/component/AnimatedComponent',
];

/**
 * Whether a folder is inside a package, judged by the folder the package is unpacked into rather
 * than by its name appearing anywhere in the path, since pnpm names every package's folder after
 * the peers it was installed with.
 *
 * @param folder - The folder asking.
 * @param name - The package.
 * @returns Whether the folder is the package's own.
 */
const isInside = (folder: string, name: string): boolean =>
  folder.includes(`/node_modules/${name}/`) || folder.endsWith(`/node_modules/${name}`);

/**
 * Finds a module for Jest as Reanimated's own Jest resolver does, reading Worklets and the parts of
 * Reanimated that run in JavaScript under test as the web reads them, but recognising the packages
 * by their own folders so a pnpm install does not turn all of Reanimated into its web build.
 *
 * @param request - What is imported.
 * @param options - Where from, and how Jest would find it.
 * @returns The file it resolves to.
 */
const sync = (request: string, options: AResolving): string => {
  const asOnTheWeb = {
    ...options,
    ...(options.extensions === undefined
      ? {}
      : { extensions: options.extensions.filter((extension) => !extension.includes('native')) }),
  };
  const named = request.split('/').at(-1);
  const isDrawnAsOnTheWeb = DRAWN_AS_ON_THE_WEB_IN_JEST.some((entry) =>
    entry.includes('/') ? request.endsWith(entry) : named === entry,
  );

  if (
    request.startsWith('.') &&
    isDrawnAsOnTheWeb &&
    isInside(options.basedir, 'react-native-reanimated')
  ) {
    return options.defaultResolver(request, asOnTheWeb);
  }

  if (
    isInside(options.basedir, 'react-native-worklets') ||
    request === 'react-native-worklets' ||
    request.startsWith('react-native-worklets/')
  ) {
    return options.defaultResolver(request, asOnTheWeb);
  }

  return options.defaultResolver(request, options);
};

export { sync };
