import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { cn } from '@ValenceUI/cn';
import { pluginImageUrl } from '@ValenceClient/plugins/pluginImageUrl';
import { glyphFor } from '@ValenceSDK/surface/glyphFor';
import { PLUGIN_ICONS } from '@ValenceScreens/components/PluginSurface/PLUGIN_ICONS';
import { PluginMedia } from '@ValenceScreens/components/PluginSurface/components/PluginMedia/PluginMedia';
import { PluginRow } from '@ValenceScreens/components/PluginSurface/components/PluginRow/PluginRow';
import type { PluginBlockProps } from './PluginBlock.types';

const TEXT_TONES = {
  default: 'text-text',
  muted: 'text-text-muted',
  danger: 'text-danger',
  success: 'text-success',
} as const;

const NOTICE_TONES = {
  info: 'quiet',
  success: 'quiet',
  warning: 'warning',
  danger: 'danger',
} as const;

const BUTTON_TONES = {
  primary: 'confirm',
  secondary: 'secondary',
  danger: 'danger',
} as const;

/**
 * One building block of a plugin's page, drawn with Valence's own components. Everything a plugin
 * sends is shown as text; nothing is read as markup, a link only ever opens an HTTPS address in a
 * new tab, and a picture only ever comes from this server.
 *
 * @param pluginId - The plugin that drew it.
 * @param block - The block.
 * @param fields - What somebody has filled in so far.
 * @param onField - Told a field changed.
 * @param onAct - Told something was pressed.
 * @param isActing - Whether the plugin is still answering the last press.
 */
const PluginBlock = ({ pluginId, block, fields, onField, onAct, isActing }: PluginBlockProps) => {
  switch (block.type) {
    case 'heading':
      return <h3 className="text-base font-semibold tracking-tight text-text">{block.text}</h3>;
    case 'text':
      return (
        <p
          className={cn(
            'whitespace-pre-line text-sm leading-relaxed',
            TEXT_TONES[block.tone ?? 'default'],
          )}
        >
          {block.text}
        </p>
      );
    case 'notice':
      return (
        <Callout title={block.title ?? block.text} tone={NOTICE_TONES[block.tone]}>
          {block.title === undefined ? null : block.text}
        </Callout>
      );
    case 'row':
      return <PluginRow pluginId={pluginId} row={block} onAct={onAct} isActing={isActing} />;
    case 'button':
      return (
        <Button
          variant={BUTTON_TONES[block.tone ?? 'secondary']}
          disabled={isActing}
          className="self-start"
          onClick={() => {
            onAct(block.action);
          }}
        >
          {block.icon === undefined ? null : (
            <Icon of={glyphFor(PLUGIN_ICONS, block.icon)} size={16} />
          )}
          {block.label}
        </Button>
      );
    case 'toggle':
      return (
        <div className="flex flex-col gap-1">
          <Switch
            label={block.label}
            isOn={fields[block.field] === true}
            onToggle={() => {
              onField(block.field, fields[block.field] !== true);
            }}
          />

          {block.help === undefined ? null : (
            <span className="text-xs text-text-muted">{block.help}</span>
          )}
        </div>
      );
    case 'textField': {
      const value = fields[block.field];

      return (
        <TextField
          label={block.label}
          type={block.isSecret === true ? 'password' : 'text'}
          value={typeof value === 'string' ? value : ''}
          autoComplete={block.isSecret === true ? 'new-password' : 'off'}
          {...(block.placeholder === undefined ? {} : { placeholder: block.placeholder })}
          onValueChange={(next) => {
            onField(block.field, next);
          }}
        />
      );
    }
    case 'select': {
      const value = fields[block.field];
      const selected = typeof value === 'string' ? value : '';

      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">{block.label}</span>

          <OptionMenu
            label={block.label}
            triggerShape="field"
            align="start"
            trigger={
              block.options.find((option) => option.value === selected)?.label ?? block.label
            }
            groups={[
              {
                name: block.label,
                options: block.options.map((option) => ({ id: option.value, label: option.label })),
                selectedId: selected,
                onSelect: (id) => {
                  onField(block.field, id);
                },
              },
            ]}
          />
        </div>
      );
    }
    case 'progress':
      return (
        <ProgressBar
          label={block.label ?? 'Progress'}
          value={Math.round(block.value * 100)}
          max={100}
          readout={`${Math.round(block.value * 100).toString()}%`}
        />
      );
    case 'image':
      return (
        <img
          src={pluginImageUrl(pluginId, block.image)}
          alt={block.alt}
          loading="lazy"
          className="max-h-72 w-auto self-start rounded-lg object-contain"
        />
      );
    case 'link':
      return (
        <Link href={block.url} className="self-start text-sm">
          {block.label}
        </Link>
      );
    case 'media':
      return <PluginMedia mediaId={block.mediaId} />;
    case 'divider':
      return <hr className="border-border/60" />;
    case 'section':
      return (
        <section className="flex flex-col gap-3">
          {block.title === undefined ? null : (
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              {block.title}
            </h4>
          )}

          {block.children.map((child, at) => (
            <PluginBlock
              key={`${child.type}-${at.toString()}`}
              pluginId={pluginId}
              block={child}
              fields={fields}
              onField={onField}
              onAct={onAct}
              isActing={isActing}
            />
          ))}
        </section>
      );
    case 'list':
      return (
        <section className="flex flex-col gap-1">
          {block.title === undefined ? null : (
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              {block.title}
            </h4>
          )}

          <div className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/60">
            {block.rows.map((row, at) => (
              <PluginRow
                key={`${row.label}-${at.toString()}`}
                pluginId={pluginId}
                row={row}
                onAct={onAct}
                isActing={isActing}
              />
            ))}
          </div>
        </section>
      );
  }
};

PluginBlock.displayName = 'PluginBlock';

export { PluginBlock };
