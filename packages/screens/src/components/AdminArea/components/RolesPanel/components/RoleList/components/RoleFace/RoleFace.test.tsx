import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RoleFace } from './RoleFace';

describe('RoleFace', () => {
  it('names the role and counts who holds it', () => {
    render(
      <RoleFace
        name="Member"
        color="#3366ff"
        grantsEverything={false}
        memberCount={3}
        isChosen={false}
        lead={null}
        menu={null}
        onChoose={vi.fn()}
      />,
    );

    const face = screen.getByRole('button', { name: /Member/ });

    expect(face).toHaveTextContent('3 members');
    expect(face).not.toHaveAttribute('aria-current');
  });

  it('counts one holder without saying "1 members"', () => {
    render(
      <RoleFace
        name="Member"
        color={null}
        grantsEverything={false}
        memberCount={1}
        isChosen={false}
        lead={null}
        menu={null}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText('1 member')).toBeInTheDocument();
  });

  it('counts nobody for a role not saved yet', () => {
    render(
      <RoleFace
        name="New role"
        color={null}
        grantsEverything={false}
        memberCount={null}
        isChosen
        lead={null}
        menu={null}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'New role' })).not.toHaveTextContent(/member/);
  });

  it('marks the role open beside the list', () => {
    render(
      <RoleFace
        name="Member"
        color={null}
        grantsEverything={false}
        memberCount={0}
        isChosen
        lead={null}
        menu={null}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Member/ })).toHaveAttribute('aria-current', 'true');
  });

  it('is told when it is pressed', async () => {
    const onChoose = vi.fn();

    render(
      <RoleFace
        name="Member"
        color={null}
        grantsEverything={false}
        memberCount={0}
        isChosen={false}
        lead={null}
        menu={null}
        onChoose={onChoose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Member/ }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('draws what leads it inside the face, and its menu beside the face', () => {
    render(
      <RoleFace
        name="Administrator"
        color={null}
        grantsEverything
        memberCount={1}
        isChosen={false}
        lead={<span role="img" aria-label="Above your role" />}
        menu={<span role="group" aria-label="Actions for Administrator" />}
        onChoose={vi.fn()}
      />,
    );

    const face = screen.getByRole('button', { name: /Administrator/ });

    expect(face).toContainElement(screen.getByRole('img', { name: 'Above your role' }));
    expect(face).not.toContainElement(
      screen.getByRole('group', { name: 'Actions for Administrator' }),
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RoleFace.displayName).toBe('RoleFace');
  });
});
