import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aFederationActivity } from '@ValenceClient/testing/aFederationActivity';
import { ActivityList } from './ActivityList';

describe('ActivityList', () => {
  it('says there is nothing yet, for an empty record', () => {
    render(<ActivityList entries={[]} itself="Films itself" someone="Someone from Films" />);

    expect(screen.getByText('Nothing yet.')).toBeInTheDocument();
  });

  it('says who asked, what for, about which title and how it was answered', () => {
    render(
      <ActivityList
        entries={[aFederationActivity({ outcome: 'aboveTheAge', count: 3 })]}
        itself="Films itself"
        someone="Someone from Films"
      />,
    );

    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Looked up a title · Arrival')).toBeInTheDocument();
    expect(screen.getByText('Above the age limit')).toBeInTheDocument();
    expect(screen.getByText(/3 times/u)).toBeInTheDocument();
  });

  it('names a request the server made for itself, and a person whose name was not sent', () => {
    render(
      <ActivityList
        entries={[
          aFederationActivity({ id: '00000000-0000-4000-8000-0000000000e2', personId: null }),
          aFederationActivity({ personName: null, mediaTitle: null, action: 'libraries' }),
        ]}
        itself="Films itself"
        someone="Someone from Films"
      />,
    );

    expect(screen.getByText('Films itself')).toBeInTheDocument();
    expect(screen.getByText('Someone from Films')).toBeInTheDocument();
    expect(screen.getByText('Listed shared libraries')).toBeInTheDocument();
  });
});
