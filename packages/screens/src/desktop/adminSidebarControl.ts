import { useSyncExternalStore } from 'react';

type AdminSidebarControl = {
  isOpen: boolean;
  label: string;
  onToggle: () => void;
};

let current: AdminSidebarControl | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

const setAdminSidebarControl = (next: AdminSidebarControl | null) => {
  current = next;
  emit();
};

const subscribeToAdminSidebarControl = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const readAdminSidebarControl = () => current;

const useAdminSidebarControl = () =>
  useSyncExternalStore(
    subscribeToAdminSidebarControl,
    readAdminSidebarControl,
    readAdminSidebarControl,
  );

export { setAdminSidebarControl, useAdminSidebarControl };
export type { AdminSidebarControl };
