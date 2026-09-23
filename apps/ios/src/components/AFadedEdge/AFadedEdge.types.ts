import type { ReactNode } from 'react';

type AFadedEdgeProps = {
  leading: number;
  trailing: number;
  isUpright?: boolean;
  children: ReactNode;
};

type NativeFadedEdgesProps = {
  leading: number;
  trailing: number;
  isUpright: boolean;
  children: ReactNode;
  style: { alignSelf: 'stretch' } | { flex: 1 };
};

export type { AFadedEdgeProps, NativeFadedEdgesProps };
