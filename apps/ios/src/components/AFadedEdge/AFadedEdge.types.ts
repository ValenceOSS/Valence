import type { ReactNode } from 'react';

type AFadedEdgeProps = {
  leading: number;
  trailing: number;
  children: ReactNode;
};

type NativeFadedEdgesProps = {
  leading: number;
  trailing: number;
  children: ReactNode;
  style: { alignSelf: 'stretch' };
};

export type { AFadedEdgeProps, NativeFadedEdgesProps };
