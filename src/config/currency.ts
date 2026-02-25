export const CURRENCY_CONFIG = {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA',
    locale: 'fr-CM',
    decimals: 0
};

export const formatPrice = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0 FCFA';

    return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
        style: 'currency',
        currency: CURRENCY_CONFIG.code,
        minimumFractionDigits: CURRENCY_CONFIG.decimals,
        maximumFractionDigits: CURRENCY_CONFIG.decimals,
    }).format(amount);
};
