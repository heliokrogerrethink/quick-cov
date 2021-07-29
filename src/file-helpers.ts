import fs from 'fs';
import crypto from 'crypto';
import type { FileInfo } from './types';

export const checksum = (str: string): string => {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
};

export const getFileContent = (
    path: string,
    encoding: BufferEncoding = 'utf-8'
) => {
    return fs.readFileSync(path, encoding);
};

export const fileExists = (path: string) => {
    return fs.existsSync(path);
};

export const writeFile = (path: string, content: string) => {
    return fs.writeFileSync(path, content);
};

export const getFilesChecksums = (
    paths: string[]
): { [key: string]: FileInfo } => {
    return paths.reduce((prev, next) => {
        const content = getFileContent(next);
        const hash = checksum(content);
        return {
            ...prev,
            [next]: { hash },
        };
    }, {});
};

export const getUpdatedFilesFromList = (
    files: { [key: string]: FileInfo },
    newPaths: string[]
): string[] => {
    const paths = Object.keys(files);

    const addedFiles = newPaths.filter((newPath) => !paths.includes(newPath));

    const updatedFiles = paths.filter((path) => {
        if (!fileExists(path)) return false;
        const content = getFileContent(path);
        const hash = checksum(content);

        return hash !== files[path].hash;
    });

    return [...addedFiles, ...updatedFiles];
};
