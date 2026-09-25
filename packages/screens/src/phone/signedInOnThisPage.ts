let isSignedInHere = false;

const signedInOnThisPage = {
  mark: (): void => {
    isSignedInHere = true;
  },
  read: (): boolean => isSignedInHere,
  forget: (): void => {
    isSignedInHere = false;
  },
};

export { signedInOnThisPage };
