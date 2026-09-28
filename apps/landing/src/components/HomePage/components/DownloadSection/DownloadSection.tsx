import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  IconArrowRight,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandDocker,
  IconBrandWindows,
  IconDeviceDesktop,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { describeReleaseDate } from '@ValenceLanding/content/changelog/describeReleaseDate';
import { SERVER_COMMANDS } from '@ValenceLanding/content/downloads/SERVER_COMMANDS';
import { detectPlatform } from '@ValenceLanding/content/downloads/detectPlatform';
import { downloadChoicesFor } from '@ValenceLanding/content/downloads/downloadChoicesFor';
import { latestRelease } from '@ValenceLanding/content/downloads/latestRelease';
import { CopyableCommands } from './components/CopyableCommands/CopyableCommands';
import { DownloadRow } from './components/DownloadRow/DownloadRow';
import rawReleases from 'virtual:changelog';

const LATEST = latestRelease(rawReleases);

const LEAD_GLYPHS = {
  macAppleSilicon: IconBrandApple,
  macIntel: IconBrandApple,
  windows: IconBrandWindows,
  linux: IconDeviceDesktop,
} as const;

const DOC_LINK =
  'inline-flex items-center gap-1 text-sm font-semibold text-accent underline-offset-4 hover:underline';

const HEADING = 'font-mono text-xs uppercase tracking-[0.14em] text-text-muted';

/**
 * Where to get Valence: the latest release and what is new in it, the desktop app for the
 * visitor's own computer first and every other one beneath it, the few commands that start a
 * server, and what there is for a phone. A visitor on a phone is shown the phone first.
 */
const DownloadSection = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [platform] = useState(() => detectPlatform(navigator));
  const { lead, others } = downloadChoicesFor(LATEST, platform);
  const isOnAPhone = platform === 'iphone' || platform === 'android';
  const intel = platform === 'mac' ? others.find((choice) => choice.id === 'macIntel') : undefined;
  const LeadGlyph = lead === null ? null : LEAD_GLYPHS[lead.id];

  const phones = (
    <div className={cn('flex flex-col gap-3 p-6 sm:p-8', isOnAPhone ? 'bg-surface-raised/40' : '')}>
      <p className={HEADING}>Phones</p>

      <p className="flex items-center gap-3 text-lg font-semibold text-text">
        <IconDeviceMobile size={20} className="text-text-muted" />
        Valence for iPhone and Android
      </p>

      <p className="max-w-md text-sm leading-relaxed text-text-muted">
        The phone app finds your server on the network, downloads films to watch without it and
        plays music and audiobooks. It is not in the App Store or Google Play yet.
      </p>

      <span className="flex items-center gap-3 text-text-muted">
        <IconBrandApple size={18} />
        <IconBrandAndroid size={18} />
        <a href={`${DOCS_URL}/use/the-phone-app`} className={DOC_LINK}>
          How to get it
          <IconArrowRight size={14} />
        </a>
      </span>
    </div>
  );

  return (
    <section
      id="download"
      aria-label="Download"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-10 xl:max-w-7xl"
    >
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
        className="flex flex-col gap-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold tracking-tight text-text lg:text-4xl">
              Get Valence
            </h2>
            <p className="max-w-xl text-text-muted">
              A server you run, and an app for every screen that watches from it.
            </p>
          </div>

          {LATEST === null ? null : (
            <Link
              to="/changelog"
              className="group inline-flex items-center gap-2 self-start rounded-full border border-border/60 px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text sm:self-auto"
            >
              <span className="font-semibold text-text">{LATEST.version}</span>
              {LATEST.publishedAt === null ? null : (
                <span>{describeReleaseDate(LATEST.publishedAt)}</span>
              )}
              <span className="inline-flex items-center gap-1 text-accent">
                What&rsquo;s new
                <IconArrowRight
                  size={14}
                  className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border/60 lg:grid-cols-2">
          {isOnAPhone ? (
            <div className="border-b border-border/60 lg:col-span-2">{phones}</div>
          ) : null}

          <div className="flex flex-col gap-6 border-b border-border/60 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className={HEADING}>Desktop</p>

            {lead === null || LeadGlyph === null ? (
              <p className="text-lg font-semibold text-text">Choose your computer</p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="flex items-center gap-3 text-lg font-semibold text-text">
                  <LeadGlyph size={20} className="text-text-muted" />
                  Valence for {lead.system}
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  className="self-start"
                  onClick={() => {
                    window.location.assign(lead.url);
                  }}
                >
                  Download for {lead.system}
                </Button>

                <p className="font-mono text-xs text-text-muted/80">
                  {lead.detail}
                  {lead.sizeBytes === null ? '' : ` · ${formatBytes(lead.sizeBytes)}`}
                  {lead.fileName === null ? '' : ` · ${lead.fileName}`}
                </p>

                {intel === undefined ? null : (
                  <p className="text-sm text-text-muted">
                    On an Intel Mac?{' '}
                    <a href={intel.url} className={DOC_LINK}>
                      Download for Intel
                    </a>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col">
              {lead === null ? null : <p className={cn(HEADING, 'pt-2')}>Other platforms</p>}

              <ul className="divide-y divide-border/60">
                {others
                  .filter((choice) => choice !== intel)
                  .map((choice) => (
                    <DownloadRow key={choice.id} choice={choice} />
                  ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <p className={HEADING}>Your server</p>

            <p className="flex items-center gap-3 text-lg font-semibold text-text">
              <IconBrandDocker size={20} className="text-text-muted" />
              One compose file
            </p>

            <p className="max-w-md text-sm leading-relaxed text-text-muted">
              Download the compose file and its settings, fill in the four that are required, and
              start it. Your library is mounted read only.
            </p>

            <CopyableCommands
              commands={SERVER_COMMANDS}
              label="Commands that start a Valence server"
            />

            <span className="flex flex-wrap gap-x-5 gap-y-2">
              <a href={`${DOCS_URL}/install/complete-compose-file`} className={DOC_LINK}>
                The complete compose file
                <IconArrowRight size={14} />
              </a>
              <a href={`${DOCS_URL}/start/set-up-with-an-ai`} className={DOC_LINK}>
                Set it up with an AI assistant
                <IconArrowRight size={14} />
              </a>
            </span>
          </div>

          {isOnAPhone ? null : (
            <div className="border-t border-border/60 lg:col-span-2">{phones}</div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

DownloadSection.displayName = 'DownloadSection';

export { DownloadSection };
