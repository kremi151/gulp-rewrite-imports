declare module 'replacestream' {
    interface ReplaceStreamOptions {
        limit?: number;
        encoding?: string;
        maxMatchLen?: number;
    }
    export default function ReplaceStream(
        search: RegExp | string,
        replace: ((substring: string, ...args: any[]) => string) | string,
        options?: ReplaceStreamOptions
    ): import("stream").Transform;
}
