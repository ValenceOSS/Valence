type LinkTokenPerson = {
  pseudonym: string;
  name: string | null;
};

type LinkTokenSigner = {
  from: string;
  person: LinkTokenPerson | null;
};

export type { LinkTokenPerson, LinkTokenSigner };
