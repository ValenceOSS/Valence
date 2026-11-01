import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Icon } from '@ValenceUI/Icon';
import { WORDMARKS, marksOfDevice } from '@ValenceScreens/devices/marksOfDevice';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
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
 * @param userAgent - What the device sent as its user agent, shown on hover, where it is known.
 */
const DeviceLabel = ({
  device,
  client = null,
  identity = null,
  clientKind = 'browser',
  userAgent = null,
}: DeviceLabelProps) => {
  const { deviceGlyph, systemMark, clientGlyph, clientMark } = marksOfDevice(identity, clientKind);
  const system = systemMark === null || WORDMARKS.has(systemMark) ? null : systemMark;
  const deviceNamed = (
    <span className="flex min-w-0 items-center gap-1.5">
      {system === null ? (
        <Icon of={deviceGlyph} size={14} className="shrink-0" />
      ) : (
        <BrandGlyph of={system} size={14} />
      )}
      <span className="truncate">{device}</span>
    </span>
  );

  return (
    <span
      className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-text-muted"
      title={userAgent ?? undefined}
    >
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
                <span className="truncate">{client}</span>
              </span>
            ),
          }}
        />
      )}
    </span>
  );
};

DeviceLabel.displayName = 'DeviceLabel';

export { DeviceLabel };
