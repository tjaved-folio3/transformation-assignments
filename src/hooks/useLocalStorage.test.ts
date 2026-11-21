import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage.ts';

const parseCount = (raw: string | null) => {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
};

describe('useLocalStorage', () => {
  it('restores a saved value and saves updates', () => {
    localStorage.setItem('count', '5');
    const { result } = renderHook(() => useLocalStorage('count', parseCount));
    expect(result.current[0]).toBe(5);

    act(() => result.current[1](6));
    expect(result.current[0]).toBe(6);
    expect(localStorage.getItem('count')).toBe('6');
  });

  it('falls back safely when storage holds junk', () => {
    localStorage.setItem('count', 'not-a-number');
    const { result } = renderHook(() => useLocalStorage('count', parseCount));
    expect(result.current[0]).toBe(0);
  });
});
