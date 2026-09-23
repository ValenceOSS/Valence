import type { ReactNode } from 'react';
type UpTarget = number | null;

type SystemSearchProps = {
  placeholder: string;
  onChangeText: (text: string) => void;
  onResultsLayout: (size: { width: number; height: number }) => void;
  upTo: UpTarget;
  children: ReactNode;
};

type NativeSearchProps = {
  placeholder: string;
  onChangeText: (event: { nativeEvent: object }) => void;
  onResultsLayout: (event: { nativeEvent: object }) => void;
  upTo: UpTarget;
  style: { flex: number };
  children: ReactNode;
};

export type { NativeSearchProps, SystemSearchProps, UpTarget };
