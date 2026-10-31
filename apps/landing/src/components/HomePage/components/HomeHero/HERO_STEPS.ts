const HERO_STEPS = [
  {
    id: 'shelf',
    title: 'Everything on one shelf.',
    detail: 'Films, shows, music and books from your own server, in one place.',
    src: '/tour/home.jpg',
    alt: "The Valence web app's home page, with a film in the featured row",
  },
  {
    id: 'library',
    title: 'A library worth browsing.',
    detail: 'Artwork, credits and collections for everything you own.',
    src: '/tour/library.jpg',
    alt: 'Every film on the server as a grid of posters, with its rating and year beneath each',
  },
  {
    id: 'books',
    title: 'Read and listen too.',
    detail: 'Books, comics and audiobooks sit beside your films.',
    src: '/tour/books.jpg',
    alt: 'A shelf of books in the web app, each with its cover, title and author',
  },
] as const;

export { HERO_STEPS };
