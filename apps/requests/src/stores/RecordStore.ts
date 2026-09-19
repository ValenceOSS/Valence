type RecordStore<Kept extends { id: string }> = {
  list: () => Promise<Kept[]>;
  find: (id: string) => Promise<Kept | null>;
  insert: (record: Kept) => Promise<Kept>;
  update: (id: string, changes: Partial<Omit<Kept, 'id'>>) => Promise<Kept | null>;
  remove: (id: string) => Promise<boolean>;
};

export type { RecordStore };
