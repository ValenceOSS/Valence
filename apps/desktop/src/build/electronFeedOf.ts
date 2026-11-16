const FEEDS: { name: RegExp; suffix: string }[] = [
  { name: /^Valence-Setup-.+-(?:x64|arm64)\.exe$/u, suffix: '' },
  { name: /^Valence-.+-(?:x64|arm64)-mac\.zip$/u, suffix: '-mac' },
  { name: /^Valence-.+-x86_64\.AppImage$/u, suffix: '-linux' },
  { name: /^Valence-.+-arm64\.AppImage$/u, suffix: '-linux-arm64' },
];

/**
 * Which of the Electron app's update feeds a file the desktop build hands over belongs in, read
 * from its name: the feed electron-updater reads on that system, for that processor, on `channel`.
 * Windows and macOS read one feed for both processors and pick their file from it by name; Linux
 * reads one feed for each.
 *
 * @param file - The file's name, as it is published.
 * @param channel - `latest` for a release, `dev` for the dev channel.
 * @returns The feed's file name, or nothing for a file the Electron app's updater never installs.
 */
const electronFeedOf = (file: string, channel: string): string | undefined => {
  const feed = FEEDS.find(({ name }) => name.test(file));

  return feed === undefined ? undefined : `${channel}${feed.suffix}.yml`;
};

export { electronFeedOf };
