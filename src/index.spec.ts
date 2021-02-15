import 'mocha';
import { expect } from 'chai';
import MemoryStreams from 'memory-streams';
import VinylFile from 'vinyl';
import rewriter from '.';
import { Stream, Transform } from 'stream';

function streamToString(stream: Stream): Promise<string> {
    const chunks: Uint8Array[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    });
}

function waitForTransform(transform: Transform): Promise<VinylFile> {
    return new Promise((resolve, reject) => {
        transform.once('data', (file: VinylFile) => {
            resolve(file);
        });
        transform.once('error', reject);
    });
}

describe('gulp-rewrite-imports', () => {

    it('should replace texts correctly', async () => {
        const fakeFile = new VinylFile({
            contents: new Buffer(`import { Something } from 'nowhere';
const instance = new Something();
`),
        });
        const transform = rewriter({
            mappings: {
                'nowhere': 'somewhere',
            },
        });

        transform.write(fakeFile);

        const file = await waitForTransform(transform);

        expect(file.isBuffer()).to.be.true;
        expect((file.contents as Buffer).toString('utf8')).to.equal(`import { Something } from 'somewhere';
const instance = new Something();
`);
    });

    it('should replace rewrite re-exports', async () => {
        const fakeFile = new VinylFile({
            contents: new Buffer(`export { Something } from 'nowhere';
const instance = new Something();
`),
        });
        const transform = rewriter({
            mappings: {
                'nowhere': 'somewhere',
            },
        });

        transform.write(fakeFile);

        const file = await waitForTransform(transform);

        expect(file.isBuffer()).to.be.true;
        expect((file.contents as Buffer).toString('utf8')).to.equal(`export { Something } from 'somewhere';
const instance = new Something();
`);
    });

    it('should not support streams by default', async () => {
        const fakeFile = new VinylFile({
            contents: new MemoryStreams.ReadableStream(`does not matter`),
        });
        const transform = rewriter({
            mappings: {
                'nowhere': 'somewhere',
            },
        });
        expect(() => transform.write(fakeFile)).to.throw('Stream support is currently experimental and therefore by default disabled. To enable it, set experimentalEnableStreams option to true.');
    });

    it('should support streams by when setting experimental flag', async () => {
        const fakeFile = new VinylFile({
            contents: new MemoryStreams.ReadableStream(`does not matter`),
        });
        const transform = rewriter({
            mappings: {
                'nowhere': 'somewhere',
            },
            experimentalEnableStreams: true,
        });
        expect(() => transform.write(fakeFile)).to.not.throw('Stream support is currently experimental and therefore by default disabled. To enable it, set experimentalEnableStreams option to true.');
    });

    /*it('should replace streams correctly', async () => {
        const fakeFile = new VinylFile({
            contents: new MemoryStreams.ReadableStream(`import { Something } from 'nowhere';
const instance = new Something();
`),
        });
        const transform = rewriter({
            mappings: {
                'nowhere': 'somewhere',
            },
        });

        transform.write(fakeFile);

        const file = await waitForTransform(transform);

        expect(file.isStream()).to.be.true;
        const result = await streamToString(file.contents as NodeJS.ReadableStream);

        expect(result).to.equal(`import { Something } from 'somewhere';
const instance = new Something();
`);
    });*/
});
