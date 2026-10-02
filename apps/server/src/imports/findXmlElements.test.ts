import { describe, expect, it } from 'vitest';
import { findXmlElements } from './findXmlElements';
import { readXmlElements } from './readXmlElements';

describe('findXmlElements', () => {
  it('finds every element of a name at any depth, ignoring case', () => {
    const found = findXmlElements(
      readXmlElements('<root><User id="1"><user id="2"/></User><Other/></root>'),
      'user',
    );

    expect(found.map((element) => element.attributes.id)).toEqual(['1', '2']);
  });
});
