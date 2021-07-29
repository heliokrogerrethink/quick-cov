import fs from 'fs';
import type { PathOrFileDescriptor } from 'fs';
import { checksum, getFilesChecksums } from './file-helpers';

describe('testing file helpers', () => {
    it('checksum should return the hash for a string', () => {
        const str = 'hello-world';
        const hash =
            'afa27b44d43b02a9fea41d13cedc2e4016cfcf87c5dbf990e593669aa8ce286d';
        const result = checksum(str);
        expect(result).toBe(hash);
    });

    it('getTestFilesChecksums should return the hashes from a list of paths', () => {
        const testFiles = ['./file-1.js', './file-2.js'];
        const contents = ['file-1-content', 'file-2-content'];
        const hashes = {
            './file-1.js': {
                hash: '6ab9727ceca4d24f887fdf03b666cb720e5a7e2e6f36c45de5c224cee55292c3',
            },
            './file-2.js': {
                hash: 'be08233ca5d48a654ec15e71889ab813bcd41f74d54a3a0dadb29b213420fc2b',
            },
        };

        jest.spyOn(fs, 'readFileSync').mockImplementation(
            (path: PathOrFileDescriptor) => {
                const index = testFiles.indexOf(path as string);
                return contents[index];
            }
        );

        const result = getFilesChecksums(testFiles);

        expect(result).toEqual(hashes);
    });
});
