import writtenNumber from 'written-number';

export function montantLettres(amount: number): string {
    try {
        const integralPart = Math.floor(amount);
        let words = writtenNumber(integralPart, { lang: 'fr' }).toUpperCase();
        return words;
    } catch (error) {
        console.error("Error converting number to words:", error);
        return `${amount}`;
    }
}
