import { RNHostView, Section } from '@expo/ui/swift-ui';
import type { ATextLookProps } from './ATextLook.types';

/**
 * The text reader's look — the page's theme and the size of the type — as the first section of the
 * reader's sheet, drawn by the app inside it since the system has no control like it.
 *
 * @param children - The look's own controls.
 */
const ATextLook = ({ children }: ATextLookProps) => (
  <Section>
    <RNHostView matchContents={{ vertical: true }}>{children}</RNHostView>
  </Section>
);

ATextLook.displayName = 'ATextLook';

export { ATextLook };
