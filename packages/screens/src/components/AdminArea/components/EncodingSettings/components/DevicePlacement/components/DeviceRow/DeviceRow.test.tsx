import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { DeviceRow } from './DeviceRow';

const CARD: PlacedDevice = {
  id: 'pci:0000:01:00.0',
  name: 'NVIDIA GeForce RTX 5080',
  vendor: 'nvidia',
  accels: ['nvenc'],
  probed: true,
  encoders: ['h264_nvenc', 'hevc_nvenc'],
  capacity: 8,
  streams: 2,
  busyPercent: 41.5,
  isOn: true,
  maxStreams: null,
  position: 0,
};

afterEach(() => {
  vi.useRealTimers();
});

describe('DeviceRow', () => {
  it('says what drives the device and how many of its encoders were checked', () => {
    render(<DeviceRow device={CARD} isFirst isLast={false} onChange={vi.fn()} onMove={vi.fn()} />);

    expect(screen.getByText('NVIDIA GeForce RTX 5080')).toBeInTheDocument();
    expect(screen.getByText('NVENC · 2 encoders checked')).toBeInTheDocument();
  });

  it('says so where its encoders have not been checked yet', () => {
    render(
      <DeviceRow
        device={{ ...CARD, probed: false, encoders: [] }}
        isFirst
        isLast
        onChange={vi.fn()}
        onMove={vi.fn()}
      />,
    );

    expect(screen.getByText('NVENC · Encoders not checked yet')).toBeInTheDocument();
  });

  it('switches the device off', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DeviceRow device={CARD} isFirst isLast onChange={onChange} onMove={vi.fn()} />);

    await user.click(screen.getByRole('switch', { name: 'Use NVIDIA GeForce RTX 5080' }));

    expect(onChange).toHaveBeenCalledWith({ id: CARD.id, isOn: false, maxStreams: null });
  });

  it('moves down but not up from the top', async () => {
    const onMove = vi.fn();
    const user = userEvent.setup();

    render(<DeviceRow device={CARD} isFirst isLast={false} onChange={vi.fn()} onMove={onMove} />);

    expect(screen.getByRole('button', { name: 'Move NVIDIA GeForce RTX 5080 up' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Move NVIDIA GeForce RTX 5080 down' }));

    expect(onMove).toHaveBeenCalledWith(1);
  });

  it('offers the measured capacity as the most streams until another is typed', () => {
    render(<DeviceRow device={CARD} isFirst isLast onChange={vi.fn()} onMove={vi.fn()} />);

    expect(
      screen.getByRole('spinbutton', { name: 'Most streams on NVIDIA GeForce RTX 5080' }),
    ).toHaveAttribute('placeholder', '8');
  });

  it('saves the most streams once typing has stopped', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(<DeviceRow device={CARD} isFirst isLast onChange={onChange} onMove={vi.fn()} />);

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Most streams on NVIDIA GeForce RTX 5080' }),
      { target: { value: '4' } },
    );

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onChange).toHaveBeenCalledWith({ id: CARD.id, isOn: true, maxStreams: 4 });
  });

  it('does not save what is not a number of streams', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(<DeviceRow device={CARD} isFirst isLast onChange={onChange} onMove={vi.fn()} />);

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Most streams on NVIDIA GeForce RTX 5080' }),
      { target: { value: '0' } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
