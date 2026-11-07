import type { StyleProp, ViewStyle } from 'react-native';

type AMatteCurlBookLook = {
  fontSize: number;
  lineHeight: number;
  insetX: number;
  top: number;
  foot: number;
  headerCentre: number;
  footerCentre: number;
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
  chrome: string;
  heading: string;
  footer: string;
  isJustified: boolean;
};

type AMatteCurlProps = {
  pages: readonly string[];
  page: number;
  paper: string;
  isLocked: boolean;
  isAnimated?: boolean;
  book?: string;
  bookLook?: AMatteCurlBookLook;
  ink?: string;
  onTurn: (page: number) => void;
  onMiddle: () => void;
  onPastTheEnd: () => void;
  onBeforeTheStart: () => void;
  onGrab: () => void;
  onPages?: (count: number, anchors: Readonly<Record<string, number>>) => void;
  style: StyleProp<ViewStyle>;
};

type NativeMatteCurlProps = Omit<AMatteCurlProps, 'onTurn' | 'onPages'> & {
  onTurn: (event: { nativeEvent: { page: number } }) => void;
  onPages: (event: {
    nativeEvent: { count: number; anchors: Readonly<Record<string, number>> };
  }) => void;
};

export type { AMatteCurlBookLook, AMatteCurlProps, NativeMatteCurlProps };
