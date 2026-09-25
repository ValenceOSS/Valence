import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { sayInParts } from './sayInParts';

describe('sayInParts', () => {
  it('draws each part in its gap, in the order the words put them', () => {
    const { container } = render(
      <p>
        {sayInParts('admin.adminArea.processorDetail', {
          cores: <strong>10 cores</strong>,
          share: <em>19%</em>,
        })}
      </p>,
    );

    expect(container).toHaveTextContent('10 cores · Valence 19%');
    expect(container.querySelector('strong')).toHaveTextContent('10 cores');
  });

  it('leaves a gap as written where nothing is given for it', () => {
    const { container } = render(<p>{sayInParts('admin.adminArea.processorDetail', {})}</p>);

    expect(container).toHaveTextContent('{cores} · Valence {share}');
  });
});
