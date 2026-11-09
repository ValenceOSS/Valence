import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { TruncatedText } from '@ValenceUI/TruncatedText';
import { Tooltip } from '@ValenceUI/Tooltip';
import { Icon } from '@ValenceUI/Icon';
import { WORDMARKS, marksOfDevice } from '@ValenceScreens/devices/marksOfDevice';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { cn } from '@ValenceUI/cn';
import type { DeviceLabelProps } from './DeviceLabel.types';

/**
 * A device on one line, each half with its mark: the device by its system's mark or its shape, then
 * what it reaches Valence through by Valence's mark or its browser's. A maker whose mark is a word
 * rather than a symbol is drawn by its shape instead, since a word that small cannot be read.
 *
 * @param device - What the device is called, such as "iPhone 17 Pro Max".
 * @param client - What it reaches Valence through, such as "Valence for iOS", where it is known.
 * @param identity - What the device is, which picks its marks, where it is known.
 * @param clientKind - What kind of app it said it was, for a device that never said more.
 * @param userAgent - What the device sent as its user agent, where it is known. Hovering the label
 *   then names what it reaches Valence through with the user agent beneath, which says everything
 *   a cut-off name would, so the names do not each answer a hover of their own as well.
 */
const DeviceLabel = ({
  device,
  client = null,
  identity = null,
  clientKind = 'browser',
  userAgent = null,
}: DeviceLabelProps) => {
  const named = (text: string) =>
    userAgent === null ? (
      <TruncatedText text={text} />
    ) : (
      <span className="block min-w-0 truncate">{text}</span>
    );
  const { deviceGlyph, systemMark, clientGlyph, clientMark } = marksOfDevice(identity, clientKind);
  const system = systemMark === null || WORDMARKS.has(systemMark) ? null : systemMark;
  const deviceNamed = (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        client === null ? '' : 'max-w-[60%] shrink-0',
      )}
    >
      {system === null ? (
        <Icon of={deviceGlyph} size={14} className="shrink-0" />
      ) : (
        <BrandGlyph of={system} size={14} />
      )}
      {named(device)}
    </span>
  );

  const label = (
    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-text-muted">
      {client === null ? (
        deviceNamed
      ) : (
        <Sentence
          words="common.deviceThroughClient"
          fillings={{
            device: deviceNamed,
            client: (
              <span className="flex min-w-0 items-center gap-1.5">
                {clientMark === null ? (
                  <Icon of={clientGlyph} size={13} className="shrink-0" />
                ) : (
                  <BrandGlyph of={clientMark} size={13} />
                )}
                {named(client)}
              </span>
            ),
          }}
        />
      )}
    </span>
  );

  return userAgent === null ? (
    label
  ) : (
    <Tooltip label={client ?? device} detail={userAgent}>
      {label}
    </Tooltip>
  );
};

DeviceLabel.displayName = 'DeviceLabel';

export { DeviceLabel };
