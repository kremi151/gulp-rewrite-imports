import through, { TransformCallback } from 'through2';
import VinylFile from 'vinyl';
import PluginError from 'plugin-error';
import path from 'path';

const PLUGIN_NAME = 'gulp-rewrite-imports';

type TargetPath = string | {
    path: string;
    relative?: boolean;
};

interface Options {
    mappings: { [module: string]: TargetPath };
}

type ImportWriter = (module: string, imports?: string) => string;

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

export = function (options: Options) {
    return through.obj(function (file: VinylFile, enc: string, cb: TransformCallback) {
        if (file.isNull() || file.isDirectory()) {
            return cb(null, file);
        }
        if (file.isStream()) {
            // TODO
            return cb(new PluginError(PLUGIN_NAME, 'Streaming is currently not supported'));
        }
        let inContent = String(file.contents);
        let outContent = inContent;
        let regex = /(?:import(.*?)from ?(?:(?:"([^"]+)")|(?:'([^']+)'));?)|(?:require\((?:(?:"([^"]+)")|(?:'([^']+)'))\))/g;
        let match;
        while ((match = regex.exec(inContent))) {
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
                continue;
            }

            let destModule = options.mappings[srcModule];
            if (!destModule) {
                continue;
            }

            if (typeof destModule === "object") {
                destModule = resolveRelativePath(destModule.path, !!destModule.relative, file);
            }

            const rewrittenImport = importWriter(destModule, imports);
            outContent = outContent.replace(match[0], rewrittenImport);
        }

        file.contents = Buffer.from(outContent);
        cb(null, file);
    });
}
