import {
    calculateCoveredBranches,
    calculateBranchesStats,
} from './coverage-helpers';
import * as fileHelpers from './file-helpers';

describe('testing coverage helpers', () => {
    it('calculateCoveredBranches should return the length of numbers greater than zero', () => {
        const branches = [1, 1, 1, 1, 0, 0, 0];
        const result = calculateCoveredBranches(branches);
        expect(result).toBe(4);
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
