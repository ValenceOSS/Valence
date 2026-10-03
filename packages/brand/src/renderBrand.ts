import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { matteOf } from './matteOf';
import { opaqueBounds } from './opaqueBounds';
import { planBanner } from './planBanner';
import { planBrandOutputs } from './planBrandOutputs';
import { restyleIcon } from './restyleIcon';
import type { Bounds } from './opaqueBounds';
import type { BrandOutput } from './planBrandOutputs';
import type { Restyle } from './restyleIcon';

const ROOT = join(import.meta.dirname, '..', '..', '..');

const LOGO_WIDTH = 624;

const RENDER_PIXELS = 2048;

const SOLID = 128;

type Lifted = { background: Buffer; artwork: Buffer; logo: Bounds };

const say = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

/**
 * Finds Icon Composer's command-line renderer, inside the Xcode this machine uses unless
 * `VALENCE_ICTOOL` names another.
 *
 * @returns The path to `ictool`.
 * @throws If Xcode is not installed.
 */
const findIctool = (): string => {
  const named = process.env['VALENCE_ICTOOL'];

  if (named !== undefined && named !== '') {
    return named;
  }

  const developer = spawnSync('xcode-select', ['-p'], { encoding: 'utf8' });

  if (developer.status !== 0) {
    throw new Error('Rendering the icons needs Xcode 26 or later, for Icon Composer.');
  }

  return join(
    developer.stdout.trim(),
    '..',
    'Applications',
    'Icon Composer.app',
    'Contents',
    'Executables',
    'ictool',
  );
};

/**
 * Renders an Icon Composer bundle to a square picture, as the Mac would draw it.
 *
 * @param ictool - The renderer.
 * @param bundle - The `.icon` bundle.
 * @param pixels - How wide and tall the picture is.
 * @returns The picture.
 * @throws If the renderer fails.
 */
const renderIcon = (ictool: string, bundle: string, pixels: number): Buffer => {
  const out = mkdtempSync(join(tmpdir(), 'valence-icon-'));
  const file = join(out, 'icon.png');
  const size = pixels.toString();
  const outcome = spawnSync(
    ictool,
    [
      bundle,
      '--export-image',
      '--output-file',
      file,
      '--platform',
      'macOS',
      '--rendition',
      'Default',
      '--width',
      size,
      '--height',
      size,
      '--scale',
      '1',
    ],
    { encoding: 'utf8' },
  );

  if (outcome.error !== undefined || outcome.status !== 0) {
    throw new Error(`Icon Composer could not render ${bundle}: ${outcome.stderr}`);
  }

  const picture = readFileSync(file);

  rmSync(out, { recursive: true, force: true });

  return picture;
};

/**
 * Renders a restyled copy of an Icon Composer bundle, leaving the bundle itself alone.
 *
 * @param ictool - The renderer.
 * @param bundle - The `.icon` bundle.
 * @param restyle - What to change for this render.
 * @param pixels - How wide and tall the picture is.
 * @returns The picture, three bytes a pixel.
 */
const renderRestyled = async (
  ictool: string,
  bundle: string,
  restyle: Restyle,
  pixels: number,
): Promise<Buffer> => {
  const work = mkdtempSync(join(tmpdir(), 'valence-restyled-'));
  const copy = join(work, 'restyled.icon');

  cpSync(bundle, copy, { recursive: true });
  writeFileSync(
    join(copy, 'icon.json'),
    restyleIcon(readFileSync(join(bundle, 'icon.json'), 'utf8'), restyle),
  );

  const picture = await sharp(renderIcon(ictool, copy, pixels))
    .removeAlpha()
    .raw()
    .toBuffer();

  rmSync(work, { recursive: true, force: true });

  return picture;
};

/**
 * Lifts the icon apart: its background on its own, and its artwork with the transparency it needs to
 * be laid over something else, with where the solid logo sits.
 *
 * @param ictool - The renderer.
 * @param bundle - The `.icon` bundle.
 * @returns The background, the artwork, and the logo's place in both.
 * @throws If the icon draws nothing solid on its background.
 */
const liftApart = async (ictool: string, bundle: string): Promise<Lifted> => {
  const onBlack = await renderRestyled(
    ictool,
    bundle,
    { background: 'extended-srgb:0.00000,0.00000,0.00000,1.00000' },
    RENDER_PIXELS,
  );
  const onWhite = await renderRestyled(
    ictool,
    bundle,
    { background: 'extended-srgb:1.00000,1.00000,1.00000,1.00000' },
    RENDER_PIXELS,
  );
  const artwork = matteOf(onBlack, onWhite);
  const inset = Math.round(RENDER_PIXELS * 0.1);
  const logo = opaqueBounds(
    artwork,
    RENDER_PIXELS,
    {
      left: inset,
      top: inset,
      width: RENDER_PIXELS - inset * 2,
      height: RENDER_PIXELS - inset * 2,
    },
    SOLID,
  );

  if (logo === null) {
    throw new Error(`${bundle} draws nothing on its background to put on a banner.`);
  }

  return {
    background: await renderRestyled(ictool, bundle, { isArtworkHidden: true }, RENDER_PIXELS),
    artwork,
    logo,
  };
};

/**
 * Makes one picture of the icon or logo and writes it where it belongs.
 *
 * @param ictool - The renderer.
 * @param output - What to make.
 * @param lifted - The icon lifted apart, for banners, made once and shared.
 */
const make = async (
  ictool: string,
  output: BrandOutput,
  lifted: () => Promise<Lifted>,
): Promise<void> => {
  const from = join(ROOT, output.from);
  const to = join(ROOT, output.to);

  mkdirSync(dirname(to), { recursive: true });

  switch (output.kind) {
    case 'copy':
      rmSync(to, { recursive: true, force: true });
      cpSync(from, to, { recursive: statSync(from).isDirectory() });

      return;
    case 'mark':
      await sharp(from, { density: Math.max(72, Math.ceil((72 * 2 * output.width) / LOGO_WIDTH)) })
        .resize(output.width, output.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(to);

      return;
    case 'icon':
      await sharp(renderIcon(ictool, from, output.pixels - output.margin * 2))
        .extend({
          top: output.margin,
          bottom: output.margin,
          left: output.margin,
          right: output.margin,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(to);

      return;
    case 'banner': {
      const icon = await lifted();
      const plan = planBanner(
        output.width,
        output.height,
        output.logoShare,
        RENDER_PIXELS,
        icon.logo,
      );
      const raw = { width: RENDER_PIXELS, height: RENDER_PIXELS };
      const ground =
        output.layers === 'logo'
          ? sharp({
              create: {
                width: output.width,
                height: output.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
              },
            })
          : sharp(
              await sharp(icon.background, { raw: { ...raw, channels: 3 } })
                .extract(plan.background)
                .resize(output.width, output.height, { fit: 'fill' })
                .png()
                .toBuffer(),
            );

      if (output.layers === 'background') {
        await ground.png().toFile(to);

        return;
      }

      const artworkHeight = Math.round((plan.logoHeight * plan.artwork.height) / icon.logo.height);
      const artwork = await sharp(icon.artwork, { raw: { ...raw, channels: 4 } })
        .extract(plan.artwork)
        .resize({ height: artworkHeight })
        .png()
        .toBuffer({ resolveWithObject: true });

      await ground
        .composite([
          {
            input: artwork.data,
            left: Math.round((output.width - artwork.info.width) / 2),
            top: Math.round((output.height - artwork.info.height) / 2),
          },
        ])
        .png()
        .toFile(to);

      return;
    }
  }
};

const ictool = findIctool();

let lifting: Promise<Lifted> | null = null;

for (const output of planBrandOutputs()) {
  await make(ictool, output, () => {
    lifting ??= liftApart(ictool, join(ROOT, output.from));

    return lifting;
  });
  say(`made ${output.to}`);
}
