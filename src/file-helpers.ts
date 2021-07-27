import fs from 'fs';
import crypto from 'crypto';

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
