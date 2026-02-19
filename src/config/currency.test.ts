import { describe, it, expect } from 'vitest';
import { formatPrice } from './currency';

describe('Currency Config', () => {
    it('formats price correctly', () => {
        expect(formatPrice(1000)).toBe('1 000 FCFA');
        expect(formatPrice(0)).toBe('0 FCFA');
        expect(formatPrice(null)).toBe('0 FCFA');
    });

    it('handles large numbers', () => {
        expect(formatPrice(1000000)).toBe('1 000 000 FCFA');
    });
});
