import { checksum } from './file-helpers';

describe('testing file helpers', () => {
    it('`checksum` should return the hash for a string', () => {
        const str = 'hello-world';
        const hash =
            'afa27b44d43b02a9fea41d13cedc2e4016cfcf87c5dbf990e593669aa8ce286d';
        const result = checksum(str);
        expect(result).toBe(hash);
    });
});
