import { describe, it, expect } from 'vitest';
import { calculateOrderTotal, canMarkAsPaid } from './order-utils';
import { Order, OrderItem } from '@/types';

describe('Order Logic', () => {
    describe('calculateOrderTotal', () => {
        it('calculates total correctly for single item', () => {
            const items = [
                { quantity: 2, unit_price: 500 }
            ] as OrderItem[];

            expect(calculateOrderTotal(items)).toBe(1000);
        });

        it('calculates total correctly for multiple items', () => {
            const items = [
                { quantity: 2, unit_price: 500 }, // 1000
                { quantity: 1, unit_price: 2000 } // 2000
            ] as OrderItem[];

            expect(calculateOrderTotal(items)).toBe(3000);
        });

        it('returns 0 for empty items', () => {
            expect(calculateOrderTotal([])).toBe(0);
        });
    });

    describe('canMarkAsPaid', () => {
        it('returns true for PENDING order', () => {
            const order = { status: 'PENDING' } as Order;
            expect(canMarkAsPaid(order)).toBe(true);
        });

        it('returns false for PAID order', () => {
            const order = { status: 'PAID' } as Order;
            expect(canMarkAsPaid(order)).toBe(false);
        });
    });
});
