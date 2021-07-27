import {
    calculateCoveredBranches,
    getTestFilesChecksums,
    calculateBranchesStats,
} from './coverage-helpers';
import * as fileHelpers from './file-helpers';

describe('testing coverage helpers', () => {
    it('calculateCoveredBranches should return the length of numbers greater than zero', () => {
        const branches = [1, 1, 1, 1, 0, 0, 0];
        const result = calculateCoveredBranches(branches);
        expect(result).toBe(4);
    });

    it('getTestFilesChecksums should return the hashes from a list of files', () => {
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

        jest.spyOn(fileHelpers, 'getFileContent').mockImplementation(
            (path: string) => {
                const index = testFiles.indexOf(path);
                return contents[index];
            }
        );

        const result = getTestFilesChecksums(testFiles);

        expect(result).toEqual(hashes);
    });

    it('calculateBranchesStats should return the stats for a branch report', () => {
        const result = calculateBranchesStats({
            '0': [0, 1],
        });
        expect(result).toEqual({
            total: 2,
            covered: 1,
            percentage: 0,
        });
    });
});
