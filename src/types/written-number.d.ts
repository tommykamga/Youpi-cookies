declare module 'written-number' {
    export interface WrittenNumberOptions {
        noAnd?: boolean;
        alternativeBase?: boolean;
        lang?: string;
    }

    export default function writtenNumber(n: number, options?: WrittenNumberOptions): string;
}
