import through, { TransformCallback } from 'through2';
import VinylFile from 'vinyl';
import path from 'path';
import replaceStream from 'stream-replace';

const PLUGIN_NAME = 'gulp-rewrite-imports';

type TargetPath = string | {
    path: string;
    relative?: boolean;
};

interface Options {
    mappings: { [module: string]: TargetPath };
}

type ImportWriter = (module: string, imports?: string) => string;

function createRegex() {
    return /(?:import(.*?)from ?(?:(?:"([^"]+)")|(?:'([^']+)'));?)|(?:require\((?:(?:"([^"]+)")|(?:'([^']+)'))\))/g;
}

function pipeRequire(module: string): string {
    return `require('${module}')`;
}

function pipeImport(module: string, imports: string | undefined) {
    return `import ${imports} from '${module}';`;
}

function resolveRelativePath(inPath: string, relative: boolean, file: VinylFile): string {
    if (!relative) {
        return inPath;
    }
    const absoluteFilePath = path.join(file.base, file.relative);
    const absoluteTargetPath = path.resolve(inPath);
    return path.relative(absoluteFilePath, absoluteTargetPath).replace(/\\/g, '/');
}

function handleStream(options: Options, file: VinylFile, stream: NodeJS.ReadableStream, cb: TransformCallback) {
    file.contents = stream
        .pipe(replaceStream(createRegex(), function (original, match) {
            const rewrittenImport = rewriteRegexMatch(options, file, [original].concat(match));
            if (rewrittenImport) {
                return rewrittenImport;
            } else {
                return original;
            }
        }));
    cb(null, file);
}

function rewriteRegexMatch(options: Options, file: VinylFile, match: any[]): string | undefined {
    let importWriter!: ImportWriter;
    let srcModule!: string;
    let imports: string | undefined;

    if (match[4] || match[5]) {
        // require
        srcModule = match[4] || match[5];
        importWriter = pipeRequire;
    } else if (match[2] || match[3]) {
        // import
        imports = match[1].trim();
        srcModule = match[2] || match[3];
        importWriter = pipeImport;
    } else {
        return undefined;
    }

    let destModule = options.mappings[srcModule];
    if (!destModule) {
        return undefined;
    }

    if (typeof destModule === "object") {
        destModule = resolveRelativePath(destModule.path, !!destModule.relative, file);
    }

    return importWriter(destModule, imports);
}

export = function (options: Options) {
    return through.obj(function (file: VinylFile, enc: string, cb: TransformCallback) {
        if (file.isNull() || file.isDirectory()) {
            return cb(null, file);
        }
        if (file.isStream()) {
            handleStream(options, file, file.contents, cb);
            return;
        }
        let inContent = String(file.contents);
        let outContent = inContent;
        let regex = createRegex();
        let match;
        while ((match = regex.exec(inContent))) {
            const rewrittenImport = rewriteRegexMatch(options, file, match);
            if (!rewrittenImport) {
                continue;
            }
            outContent = outContent.replace(match[0], rewrittenImport);
        }

        file.contents = Buffer.from(outContent);
        cb(null, file);
    });
}
