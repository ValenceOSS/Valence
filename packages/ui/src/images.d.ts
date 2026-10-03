declare module '*.png' {
  const address: string;

  // oxlint-disable-next-line import/no-default-export -- Vite hands an image to whatever imports it as its address, as the default export, and this only says so
  export default address;
}

declare module '*.svg' {
  const address: string;

  // oxlint-disable-next-line import/no-default-export -- Vite hands a brand mark to whatever imports it as its address, as the default export, and this only says so
  export default address;
}
