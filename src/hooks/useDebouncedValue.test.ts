import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue.ts';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('only updates after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'd' },
    });
    rerender({ value: 'du' });
    rerender({ value: 'duc' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('d'); // still the first value

    rerender({ value: 'duck' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('duck'); // jumped straight to the last value
  });
});
