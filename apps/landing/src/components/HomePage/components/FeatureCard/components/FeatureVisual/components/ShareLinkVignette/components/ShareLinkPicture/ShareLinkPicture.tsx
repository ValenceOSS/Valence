import { SHARE_LASTS } from '@ValenceClient/sharing/SHARE_LASTS';
import { Choice } from '@ValenceScreens/components/Choice/Choice';
import { ShareLinkReady } from '@ValenceScreens/components/ShareDialog/components/ShareLinkReady/ShareLinkReady';
import { say } from '@ValenceI18n/say';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { ShareLinkPictureProps } from './ShareLinkPicture.types';

const LINK = 'https://watch.home.lan/s/k3Fz9QwL';

/**
 * A link made for one title in the app's own share dialog, with how long it lasts, at the app's own
 * size against the right of the card; pointed at, it is copied.
 *
 * @param isCopied - Whether the link has been copied yet.
 */
const ShareLinkPicture = ({ isCopied = false }: ShareLinkPictureProps) => (
  <div className="valence-float absolute left-1/2 top-6 flex w-[16.5rem] -translate-x-1/2 flex-col rounded-xl p-3 text-left">
    <Choice label={say('common.lasts')} value="7" options={SHARE_LASTS} onSelect={nothing} />

    <ShareLinkReady link={LINK} isCopied={isCopied} onCopy={nothing} />
  </div>
);

ShareLinkPicture.displayName = 'ShareLinkPicture';

export { ShareLinkPicture };
