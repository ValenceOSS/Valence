import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import {
  forgetPlatform,
  installPlatform,
  platformIfAny,
} from '@ValenceClient/platform/installPlatform';
import { ShowcaseScope } from './ShowcaseScope';

const Reads = () => {
  const said = useQuery({
    queryKey: ['said'],
    queryFn: () => Promise.resolve('asked the server'),
  });

  return <p>{said.data ?? 'nothing yet'}</p>;
};

afterEach(() => {
  forgetPlatform();
});

describe('ShowcaseScope', () => {
  it('installs a platform with nothing behind it where none was', () => {
    render(
      <ShowcaseScope>
        <p>Inside</p>
      </ShowcaseScope>,
    );

    expect(platformIfAny()?.serverAddress()).toBeNull();
  });

  it('keeps a platform somebody already installed', () => {
    const installed = aStillPlatform();

    installPlatform(installed);
    render(
      <ShowcaseScope>
        <p>Inside</p>
      </ShowcaseScope>,
    );

    expect(platformIfAny()).toBe(installed);
  });

  it('answers from what it was filled with, and never asks the server', () => {
    render(
      <ShowcaseScope
        seed={(cache) => {
          cache.setQueryData(['said'], 'filled in advance');
        }}
      >
        <Reads />
      </ShowcaseScope>,
    );

    expect(screen.getByText('filled in advance')).toBeInTheDocument();
  });

  it('leaves what it was not filled with empty', () => {
    render(
      <ShowcaseScope>
        <Reads />
      </ShowcaseScope>,
    );

    expect(screen.getByText('nothing yet')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShowcaseScope.displayName).toBe('ShowcaseScope');
  });
});
