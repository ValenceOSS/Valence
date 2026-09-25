import { Button } from '@ValenceUI/Button';
import { Slider } from '@ValenceUI/Slider';
import { CaptionChoice } from './components/CaptionChoice/CaptionChoice';
import { toCueDeclarations } from '@ValenceScreens/playback/captionStyle';
import type { CaptionSettingsProps } from './CaptionSettings.types';
import { CAPTION_COLOURS } from '@ValenceUI/captionColours';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const COLOURS = CAPTION_COLOURS;

const FONTS = [
  { id: 'sans', labelKey: 'screens.captionSettings.fontSans' },
  { id: 'serif', labelKey: 'screens.captionSettings.fontSerif' },
  { id: 'mono', labelKey: 'screens.captionSettings.fontMono' },
  { id: 'casual', labelKey: 'screens.captionSettings.fontCasual' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

const EDGES = [
  { id: 'none', labelKey: 'screens.captionSettings.edgeNone' },
  { id: 'outline', labelKey: 'screens.captionSettings.edgeOutline' },
  { id: 'shadow', labelKey: 'screens.captionSettings.edgeShadow' },
  { id: 'raised', labelKey: 'screens.captionSettings.edgeRaised' },
] as const satisfies readonly { id: string; labelKey: StringKey }[];

/**
 * Lets the person reading the captions decide how they look — size, font, colour, background and
 * edge — with every choice taking effect on the video behind the panel as it is made, and a way back
 * to the defaults for anyone who has made it worse.
 *
 * @param style - How captions are drawn at the moment.
 * @param onChange - Called with the whole style whenever any part of it changes.
 * @param onReset - Called to put every choice back to its default.
 */
const CaptionSettings = ({ style, onChange, onReset }: CaptionSettingsProps) => (
  <section
    aria-label={say('screens.captionSettings.heading')}
    className="flex w-full flex-col gap-4 text-sm text-text"
  >
    <p
      aria-label={say('screens.captionSettings.preview')}
      className="rounded-md px-3 py-2 text-center"
      style={toCueDeclarations(style)}
    >
      {say('screens.captionSettings.previewText')}
    </p>

    <CaptionChoice
      label={say('screens.captionSettings.font')}
      options={FONTS.map((font) => ({ id: font.id, label: say(font.labelKey) }))}
      selectedId={style.fontFamily}
      onSelect={(id) => {
        onChange({ ...style, fontFamily: FONTS.find((font) => font.id === id)?.id ?? 'sans' });
      }}
    />

    <div className="flex flex-col gap-1">
      <span>{say('screens.captionSettings.sizeValue', { size: style.fontScale })}</span>

      <Slider
        label={say('screens.captionSettings.size')}
        tone="default"
        value={style.fontScale}
        max={300}
        step={10}
        onValueChange={(value) => {
          onChange({ ...style, fontScale: Math.max(50, value) });
        }}
      />
    </div>

    <CaptionChoice
      label={say('screens.captionSettings.textColour')}
      options={COLOURS}
      selectedId={style.color}
      onSelect={(id) => {
        onChange({ ...style, color: id });
      }}
    />

    <CaptionChoice
      label={say('screens.captionSettings.backgroundColour')}
      options={COLOURS}
      selectedId={style.backgroundColor}
      onSelect={(id) => {
        onChange({ ...style, backgroundColor: id });
      }}
    />

    <div className="flex flex-col gap-1">
      <span>
        {say('screens.captionSettings.opacityValue', {
          opacity: Math.round(style.backgroundOpacity * 100),
        })}
      </span>

      <Slider
        label={say('screens.captionSettings.opacity')}
        tone="default"
        value={Math.round(style.backgroundOpacity * 100)}
        max={100}
        step={5}
        onValueChange={(value) => {
          onChange({ ...style, backgroundOpacity: value / 100 });
        }}
      />
    </div>

    <CaptionChoice
      label={say('screens.captionSettings.edge')}
      options={EDGES.map((edge) => ({ id: edge.id, label: say(edge.labelKey) }))}
      selectedId={style.edgeStyle}
      onSelect={(id) => {
        onChange({ ...style, edgeStyle: EDGES.find((edge) => edge.id === id)?.id ?? 'outline' });
      }}
    />

    <Button variant="secondary" size="sm" onClick={onReset}>
      {say('screens.captionSettings.reset')}
    </Button>
  </section>
);

CaptionSettings.displayName = 'CaptionSettings';

export { CaptionSettings };
