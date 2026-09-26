import { describe, expect, it } from 'vitest';
import { AccountListSchema, AccountSchema } from './Account';
import { ViewerProfileSchema } from './ViewerProfile';

const face = {
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const account = {
  id: 'user-1',
  name: 'Marques',
  email: 'marques@valence.local',
  createdAt: '2026-01-01T00:00:00.000Z',
  isBanned: false,
  banReason: null,
  position: 0,
  isAdministrator: true,
  face,
  roles: ['Administrator'],
};

describe('AccountSchema', () => {
  it('reads an account as the server sends it', () => {
    expect(AccountSchema.parse(account).name).toBe('Marques');
  });

  it('takes a household as the face, which is what an account has', () => {
    expect(AccountSchema.parse(account).face).toMatchObject({ colour: '#3a8ee8' });
  });

  it('holds none of what a viewer profile insists on, which is why reading it as one failed', () => {
    expect(ViewerProfileSchema.safeParse(face).success).toBe(false);
  });

  it('reads an account with no face', () => {
    expect(AccountSchema.parse({ ...account, face: null }).face).toBeNull();
  });

  it('insists a face is said one way or the other, rather than quietly defaulting', () => {
    const faceless = { ...account, face: undefined };

    expect(AccountSchema.safeParse(faceless).success).toBe(false);
  });

  it('reads the list the accounts endpoint answers with', () => {
    expect(AccountListSchema.parse({ accounts: [account] }).accounts).toHaveLength(1);
  });
});
