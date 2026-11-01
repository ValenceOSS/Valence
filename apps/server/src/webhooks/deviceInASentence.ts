import { say } from '@ValenceI18n/say';

/**
 * Names a device inside a notification's sentence: the device, and what it reached Valence through
 * where that is known, so that "Dan signed in on iPhone 17 Pro Max (Valence for iOS)" says both
 * which phone it was and that it was the app.
 *
 * @param said - The device and its client, as the event carries them.
 * @returns The words for the sentence.
 */
const deviceInASentence = ({
  deviceLabel,
  clientLabel,
}: {
  deviceLabel: string;
  clientLabel: string | null;
}): string =>
  clientLabel === null
    ? deviceLabel
    : say('server.webhooks.deviceWithClient', { device: deviceLabel, client: clientLabel });

export { deviceInASentence };
