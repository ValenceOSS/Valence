import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  IconArrowRight,
  IconBrandAndroid,
  IconBrandAppleFilled,
  IconBrandDocker,
  IconBrandWindowsFilled,
  IconDeviceDesktopFilled,
  IconDeviceMobileFilled,
} from '@tabler/icons-react';
import { LinuxMark } from '@ValenceLanding/components/DownloadsPage/components/DownloadSection/components/LinuxMark/LinuxMark';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { PRESS_MOTION } from '@ValenceUI/animations/motion';
import { Button } from '@ValenceUI/Button';
import { Link as TextLink } from '@ValenceUI/Link';
import { cn } from '@ValenceUI/cn';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { describeReleaseDate } from '@ValenceLanding/content/changelog/describeReleaseDate';
import { SERVER_COMMANDS } from '@ValenceLanding/content/downloads/SERVER_COMMANDS';
import { detectPlatform } from '@ValenceLanding/content/downloads/detectPlatform';
import { useIsArm } from '@ValenceLanding/content/downloads/useIsArm';
import { downloadChoicesFor } from '@ValenceLanding/content/downloads/downloadChoicesFor';
import { latestRelease } from '@ValenceLanding/content/downloads/latestRelease';
import { nativeTranscoderFor } from '@ValenceLanding/content/downloads/nativeTranscoderFor';
import { CopyableCommands } from './components/CopyableCommands/CopyableCommands';
import { DownloadCard } from './components/DownloadCard/DownloadCard';
import { DownloadRow } from './components/DownloadRow/DownloadRow';
import rawReleases from 'virtual:changelog';

const LATEST = latestRelease(rawReleases);

const LEAD_GLYPHS = {
  macAppleSilicon: IconBrandAppleFilled,
  macIntel: IconBrandAppleFilled,
  windows: IconBrandWindowsFilled,
  windowsArm: IconBrandWindowsFilled,
  linux: LinuxMark,
  linuxArm: LinuxMark,
} as const;

const DOC_LINK =
  'inline-flex items-center gap-1 text-sm font-semibold text-text-muted no-underline hover:text-text';

const HEADING = 'font-mono text-xs uppercase tracking-[0.14em] text-text-muted';

/**
 * Where to get Valence, beneath the downloads page's opening card: the latest release and what is
 * new in it, then a card each for the desktop
 * app — the visitor's own computer first and every other one beneath it — the few commands that
 * start a server, with how to transcode in hardware on a Mac or Windows, and what there is for a
 * phone. A visitor on a phone is shown the phone first.
 */
const DownloadSection = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [platform] = useState(() => detectPlatform(navigator));
  const isArm = useIsArm();
  const { lead, others } = downloadChoicesFor(LATEST, platform, isArm);
  const nativeTranscoder = nativeTranscoderFor(platform);
  const isOnAPhone = platform === 'iphone' || platform === 'android';
  const intel = platform === 'mac' ? others.find((choice) => choice.id === 'macIntel') : undefined;
  const LeadGlyph = lead === null ? null : LEAD_GLYPHS[lead.id];

  const phones = (
    <DownloadCard
      eyebrow="Phones"
      title="Valence for iPhone and Android"
      glyph={IconDeviceMobileFilled}
      index={isOnAPhone ? 0 : 2}
      isLit={isOnAPhone}
      className="lg:col-span-2"
    >
      <p className="max-w-xl text-sm leading-relaxed text-text-muted">
        Finds your server on the network, downloads films to watch without it, and plays music and
        audiobooks. Not in the App Store or Google Play yet.
      </p>

      <span className="flex items-center gap-3 text-text-muted">
        <IconBrandAppleFilled size={18} />
        <IconBrandAndroid size={18} />
        <TextLink href={`${DOCS_URL}/use/the-phone-app`} className={DOC_LINK}>
          How to get it
          <IconArrowRight size={14} />
        </TextLink>
      </span>
    </DownloadCard>
  );

  return (
    <section
      id="download"
      aria-label="Download"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-10 sm:py-16 xl:max-w-7xl"
    >
      <motion.div
        initial="hidden"
        whileInView="shown"
        animate="hidden"
        viewport={{ margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'bouncy')}
        className="flex flex-col gap-6"
      >
        {LATEST === null ? null : (
          <Link
            to="/changelog"
            className={cn(
              'group inline-flex items-center gap-2 self-end rounded-full border border-border/60 px-3 py-1.5 text-sm text-text-muted hover:text-text',
              PRESS_MOTION,
            )}
          >
            <span className="font-semibold text-text">{LATEST.version}</span>
            {LATEST.publishedAt === null ? null : (
              <span>{describeReleaseDate(LATEST.publishedAt)}</span>
            )}
            <span className="inline-flex items-center gap-1 font-semibold text-text">
              What&rsquo;s new
              <IconArrowRight
                size={14}
                className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {isOnAPhone ? phones : null}

          <DownloadCard
            eyebrow="Desktop"
            title={lead === null ? 'Choose your computer' : `Valence for ${lead.system}`}
            glyph={LeadGlyph ?? IconDeviceDesktopFilled}
            index={isOnAPhone ? 1 : 0}
            isLit={!isOnAPhone && lead !== null}
          >
            {lead === null ? null : (
              <div className="flex flex-col gap-3">
                <span className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="confirm"
                    size="lg"
                    onClick={() => {
                      window.location.assign(lead.url);
                    }}
                  >
                    Download for {lead.system}
                  </Button>

                  {intel === undefined ? null : (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => {
                        window.location.assign(intel.url);
                      }}
                    >
                      Download for Intel
                    </Button>
                  )}
                </span>

                <p className="font-mono text-xs text-text-muted/80">
                  {lead.detail}
                  {lead.sizeBytes === null ? '' : ` · ${formatBytes(lead.sizeBytes)}`}
                  {lead.fileName === null ? '' : ` · ${lead.fileName}`}
                </p>
              </div>
            )}

            <div className="flex flex-col">
              {lead === null ? null : <p className={cn(HEADING, 'pt-1')}>Other platforms</p>}

              <ul className="divide-y divide-[var(--surface-line)]">
                {others
                  .filter((choice) => choice !== intel)
                  .map((choice) => (
                    <DownloadRow key={choice.id} choice={choice} />
                  ))}
              </ul>
            </div>
          </DownloadCard>

          <DownloadCard
            eyebrow="Your server"
            title="One compose file"
            glyph={IconBrandDocker}
            index={isOnAPhone ? 2 : 1}
          >
            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              Fill in the four required settings and start it. Your library is mounted read only.
            </p>

            <CopyableCommands
              commands={SERVER_COMMANDS}
              label="Commands that start a Valence server"
            />

            <span className="flex flex-wrap gap-x-5 gap-y-2">
              <TextLink href={`${DOCS_URL}/install/complete-compose-file`} className={DOC_LINK}>
                The complete compose file
                <IconArrowRight size={14} />
              </TextLink>
              <TextLink href={`${DOCS_URL}/start/set-up-with-an-ai`} className={DOC_LINK}>
                Set it up with an AI assistant
                <IconArrowRight size={14} />
              </TextLink>
              {nativeTranscoder === null ? null : (
                <TextLink href={nativeTranscoder.url} className={DOC_LINK}>
                  {nativeTranscoder.label}
                  <IconArrowRight size={14} />
                </TextLink>
              )}
            </span>
          </DownloadCard>

          {isOnAPhone ? null : phones}
        </div>
      </motion.div>
    </section>
  );
};

DownloadSection.displayName = 'DownloadSection';

export { DownloadSection };
