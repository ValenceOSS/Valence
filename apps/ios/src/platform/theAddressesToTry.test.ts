import { theAddressesToTry } from './theAddressesToTry';

describe('theAddressesToTry', () => {
  it('takes an address with a scheme at its word', () => {
    expect(theAddressesToTry('https://valence.example')).toEqual(['https://valence.example']);
  });

  it('takes a plain one at its word too', () => {
    expect(theAddressesToTry('http://192.168.1.10:8420')).toEqual(['http://192.168.1.10:8420']);
  });

  it('tries the secure one first for a name somebody registered', () => {
    expect(theAddressesToTry('valence.example')).toEqual([
      'https://valence.example',
      'http://valence.example',
    ]);
  });

  it('tries the plain one first for a machine on this network, which rarely has a certificate', () => {
    expect(theAddressesToTry('192.168.1.10:8420')).toEqual([
      'http://192.168.1.10:8420',
      'https://192.168.1.10:8420',
    ]);
  });

  it('knows a name ending in local is on this network', () => {
    expect(theAddressesToTry('valence.local:8420')[0]).toBe('http://valence.local:8420');
  });

  it('knows localhost is this machine', () => {
    expect(theAddressesToTry('localhost:8420')[0]).toBe('http://localhost:8420');
  });

  it('drops the spaces an address pasted from a browser carries', () => {
    expect(theAddressesToTry('  valence.example  ')[0]).toBe('https://valence.example');
  });

  it('drops the slash a browser puts on the end', () => {
    expect(theAddressesToTry('https://valence.example/')).toEqual(['https://valence.example']);
  });

  it('reads a scheme however it was capitalised', () => {
    expect(theAddressesToTry('HTTPS://valence.example')).toEqual(['HTTPS://valence.example']);
  });

  it('has nothing to try where nothing was typed', () => {
    expect(theAddressesToTry('   ')).toEqual([]);
  });
});
