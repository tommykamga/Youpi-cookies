import { Order, OrderItem } from "@/types";

/**
 * Calculates the total amount for an order based on its items.
 * @param items List of order items
 * @returns Total amount (sum of quantity * unit_price)
 */
export const calculateOrderTotal = (items: OrderItem[]): number => {
    if (!items || items.length === 0) return 0;

    return items.reduce((total, item) => {
        return total + (item.quantity * item.unit_price);
    }, 0);
};

/**
 * Validates if an order can be marked as paid.
 * @param order The order to check
 * @returns true if valid, false otherwise
 */
export const canMarkAsPaid = (order: Order): boolean => {
    return order.status !== 'PAID' && order.status !== 'CANCELLED';
};
