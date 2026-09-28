import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { Link } from '@tanstack/react-router';
import {
  ArrowRight as ArrowRightIcon,
  Globe as GlobeIcon,
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
} from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { latestRelease } from '@ValenceLanding/content/downloads/latestRelease';
import { DeviceStage } from './components/DeviceStage/DeviceStage';
import rawReleases from 'virtual:changelog';

const LATEST = latestRelease(rawReleases);

const PLATFORMS = [
  { label: 'Any browser', icon: GlobeIcon },
  { label: 'iPhone', icon: SmartphoneIcon },
  { label: 'iPad', icon: TabletIcon },
  { label: 'Android', icon: SmartphoneIcon },
  { label: 'Mac', icon: LaptopIcon },
  { label: 'Windows', icon: MonitorIcon },
  { label: 'Linux', icon: MonitorIcon },
] as const;

const LEGIBLE = 'drop-shadow-[var(--shadow-legible)]';

/**
 * The first thing anybody sees: the release that is out, what Valence is in one line, where to go
 * next, and the app itself rather than a description of it. Its own shader background lives in `LandingShell` instead of
 * here, so it isn't torn down and rebuilt every time this mounts.
 */
const Hero = () => {
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <section className="relative overflow-hidden pb-16 pt-32 sm:pt-40 lg:flex lg:min-h-svh lg:items-center lg:pb-24 lg:pt-28">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 sm:px-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 xl:max-w-7xl">
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="shown"
          className="relative z-10 flex flex-col items-start gap-5 text-left"
        >
          {LATEST === null ? null : (
            <motion.div
              variants={revealVariants(prefersReducedMotion)}
              transition={revealTransition(prefersReducedMotion)}
            >
              <Link
                to="/changelog"
                className="valence-glass--film group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm text-on-scrim/80 transition-colors hover:text-on-scrim"
              >
                <span className="font-semibold text-on-scrim">{LATEST.version}</span>
                <span>is out</span>
                <span aria-hidden className="h-3.5 w-px bg-on-scrim/30" />
                <span className="inline-flex items-center gap-1">
                  See what&rsquo;s new
                  <Icon
                    of={ArrowRightIcon}
                    size={14}
                    className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </motion.div>
          )}

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
            className={cn(
              'text-sm font-semibold uppercase tracking-[0.16em] text-on-scrim/80 lg:text-base',
              LEGIBLE,
            )}
          >
            Self-hosted. Open source. Yours.
          </motion.p>

          <motion.h1
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion, 'heavy')}
            className={cn(
              'max-w-[18ch] text-[clamp(2.5rem,6.5vw,4.25rem)] lg:text-[clamp(3rem,4.4vw,4.75rem)] font-semibold leading-[1.03] tracking-[-0.035em] text-on-scrim',
              LEGIBLE,
            )}
          >
            Your films and programmes, on every screen in the house.
          </motion.h1>

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
            className={cn('max-w-xl text-lg text-on-scrim/75 lg:text-xl', LEGIBLE)}
          >
            Valence is a streaming platform you run yourself, from a server you own. Point it at
            your library and it plays what's already there. Nothing rewritten, nothing phoned home.
          </motion.p>

          <motion.div
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
            className="flex flex-wrap items-center gap-3 pt-2 lg:gap-4"
          >
            <Button
              variant="confirm"
              size="xl"
              onClick={() => {
                document.getElementById('download')?.scrollIntoView({
                  behavior: prefersReducedMotion === true ? 'auto' : 'smooth',
                });
              }}
            >
              Get started
            </Button>

            <Button
              variant="glossy"
              size="xl"
              onClick={() => {
                window.location.assign(`${DOCS_URL}/start/quick-start`);
              }}
            >
              Read the docs
            </Button>
          </motion.div>

          <motion.p
            variants={revealVariants(prefersReducedMotion)}
            transition={revealTransition(prefersReducedMotion)}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-sm text-on-scrim/60"
          >
            <span>Runs on</span>
            {PLATFORMS.map(({ label, icon }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-on-scrim/80">
                <Icon of={icon} size={15} />
                {label}
              </span>
            ))}
          </motion.p>
        </motion.div>

        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          initial="hidden"
          animate="shown"
          transition={revealTransition(prefersReducedMotion, 'heavy')}
          className="w-full lg:-mr-[18%] lg:w-[118%]"
        >
          <DeviceStage />
        </motion.div>
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';

export { Hero };
