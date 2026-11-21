import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BackToTop } from './BackToTop.tsx';

describe('BackToTop', () => {
  it('appears after scrolling and removes its scroll listener on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<BackToTop />);
    expect(screen.queryByRole('button', { name: /back to top/i })).toBeNull();

    window.scrollY = 900;
    window.dispatchEvent(new Event('scroll'));
    expect(await screen.findByRole('button', { name: /back to top/i })).toBeDefined();

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
