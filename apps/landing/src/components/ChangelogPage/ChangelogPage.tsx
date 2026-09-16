import { useMemo } from 'react';
import { motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { ChangelogRelease } from '@ValenceLanding/components/ChangelogPage/components/ChangelogRelease/ChangelogRelease';
import { VersionSlider } from '@ValenceLanding/components/ChangelogPage/components/VersionSlider/VersionSlider';
import { readReleases } from '@ValenceLanding/content/githubRelease';
import rawReleases from 'virtual:changelog';

const RELEASES = readReleases(rawReleases);

/**
 * Every release Valence has shipped, read straight from GitHub's own release history.
 */
const ChangelogPage = () => {
  const versions = useMemo(() => RELEASES.map((release) => release.version), []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10">
      <h1 className="text-4xl font-semibold tracking-tight text-text">Changelog</h1>
      <p className="mt-2 text-text-muted">Every release, in the order it shipped.</p>

      <motion.ul initial="hidden" animate="shown" variants={groupVariants} className="mt-10">
        {RELEASES.map((release, index) => (
          <ChangelogRelease key={release.version} release={release} index={index} />
        ))}
      </motion.ul>

      <VersionSlider versions={versions} />
    </div>
  );
};

ChangelogPage.displayName = 'ChangelogPage';

export { ChangelogPage };
