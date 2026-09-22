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
  style: { flex: 1 };
};

export type { AFadedEdgeProps, NativeFadedEdgesProps };
