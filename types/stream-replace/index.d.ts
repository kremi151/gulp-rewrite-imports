declare module 'stream-replace' {
    export default function replaceStream(needle: string | RegExp, replacer: string | ((substring: string, ...args: any[]) => string)): import("stream").Transform;
}
