type CarRow = {
  id: string;
  title: string;
  detail: string | null;
  artwork: string | null;
  opens: boolean;
};

type CarSection = {
  title: string | null;
  rows: CarRow[];
};

type CarShelf = {
  id: string;
  title: string;
  symbol: string;
  sections: CarSection[];
};

type NativeCarPlay = {
  setShelves: (shelves: CarShelf[], cookie: string | null) => void;
  push: (title: string, sections: CarSection[]) => void;
  showNowPlaying: () => void;
  signedOut: (message: string) => void;
  addListener: (
    event: 'onChoose' | 'onCar',
    listener: (said: object) => void,
  ) => { remove: () => void };
};

export type { CarRow, CarSection, CarShelf, NativeCarPlay };
