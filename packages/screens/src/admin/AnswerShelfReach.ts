type Asking<Answer> = {
  readonly result: Answer;
  readonly error: DOMException | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
};

type KeptRecord = {
  accountId: string;
  key: string;
  text: string;
};

type AnswerShelf = {
  put: (record: KeptRecord) => Asking<IDBValidKey>;
  clear: () => Asking<undefined>;
  index: (name: string) => { getAll: (query: string) => Asking<readonly object[]> };
};

type AnswerShelfMaker = {
  createIndex: (name: string, keyPath: string) => object;
};

type AnswerDatabase = {
  objectStoreNames: { contains: (name: string) => boolean };
  createObjectStore: (name: string, options: { keyPath: string[] }) => AnswerShelfMaker;
  transaction: (
    name: string,
    mode: 'readonly' | 'readwrite',
  ) => { objectStore: (name: string) => AnswerShelf };
};

type OpeningAnswers = Asking<AnswerDatabase> & {
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
};

type AnswerShelfReach = {
  open: (name: string, version: number) => OpeningAnswers;
};

export type {
  AnswerDatabase,
  AnswerShelf,
  AnswerShelfMaker,
  AnswerShelfReach,
  Asking,
  KeptRecord,
  OpeningAnswers,
};
