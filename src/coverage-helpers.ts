import chalk from 'chalk';
import {
    checksum,
    getFileContent,
    fileExists,
    writeFile,
} from './file-helpers';
import type {
    CoverageTermResult,
    CoverageReport,
    CoverageStats,
    SourceFileInfo,
    TestFileInfo,
    CoverageTermStats,
} from './types';

const { yellowBright, redBright, greenBright, bold } = chalk;

export const CACHE_FILE_NAME = '.quick-cov-report.json';

export const calculateCoveredBranches = (results: number[]): number => {
    return results.reduce((prev, next) => {
        if (next === 0) return prev;
        return prev + 1;
    }, 0);
};

const initialTermStats: CoverageTermStats = {
    total: 0,
    covered: 0,
    percentage: 0,
};

export const calculateTermSum = (
    prevStats: CoverageTermStats,
    nextStats: CoverageTermStats
) => ({
    total: prevStats.total + nextStats.total,
    covered: prevStats.covered + nextStats.covered,
    percentage: 0,
});

export const calculateCoverageResult = (
    stats: CoverageStats
): Omit<SourceFileInfo, 'hash'> => {
    const { sourceFiles } = stats;

    const result = Object.values(sourceFiles).reduce(
        (prev, next) => {
            const { s, f, b } = prev;

            return {
                s: calculateTermSum(s, next.s),
                f: calculateTermSum(f, next.f),
                b: calculateTermSum(b, next.b),
            };
        },
        {
            s: initialTermStats,
            f: initialTermStats,
            b: initialTermStats,
        }
    );

    const { s, f, b } = result;
    result.s.percentage = (s.covered / s.total) * 100;
    result.f.percentage = (f.covered / f.total) * 100;
    result.b.percentage = (b.covered / b.total) * 100;

    return result;
};

export const getCoveredOverTotalResult = (terms: {
    [key: string]: CoverageTermStats;
}): string[] => {
    return Object.values(terms).map(
        (term) => `${term.covered} / ${term.total}`
    );
};

export const getPercentageResult = (terms: {
    [key: string]: CoverageTermStats;
}): string[] => {
    return Object.values(terms).map((term) => `${term.percentage.toFixed(2)}%`);
};

export const setStatsColors =
    (stats: CoverageTermStats[]) => (str: string, index: number) => {
        const { percentage } = stats[index];
        if (percentage < 50) return bold(redBright(str));
        if (percentage < 80) return bold(yellowBright(str));

        return bold(greenBright(str));
    };

export const parseCoverageResultToTable = (
    result: Omit<SourceFileInfo, 'hash'>
): string[][] => {
    const { s, f, b } = result;

    return [
        getCoveredOverTotalResult({ s, f, b }).map(setStatsColors([s, f, b])),
        getPercentageResult({ s, f, b }).map(setStatsColors([s, f, b])),
    ];
};

export const compareSourceFiles = (
    cachedSourceFiles: {
        [key: string]: SourceFileInfo;
    },
    updatedSourceFiles: {
        [key: string]: SourceFileInfo;
    }
) => {
    return Object.entries(updatedSourceFiles).reduce((prev, [key, value]) => {
        const originalFile = cachedSourceFiles[key];
        if (!originalFile) {
            return {
                ...prev,
                [key]: value,
            };
        }

        const hasChanged = value.hash !== originalFile.hash;

        if (hasChanged) {
            return {
                ...prev,
                [key]: value,
            };
        }

        return prev;
    }, cachedSourceFiles);
};

export const calculateBranchesStats = (
    branches: CoverageTermResult
): CoverageTermStats => {
    const result = Object.values(branches).reduce(
        (prev: CoverageTermStats, next) => {
            const { total, covered } = prev;

            return {
                total: total + (next as number[]).length,
                covered: covered + calculateCoveredBranches(next as number[]),
                percentage: 0,
            };
        },
        initialTermStats
    );

    return result;
};

export const calculateTermStats = (
    term: CoverageTermResult,
    termType: 's' | 'f' | 'b'
): CoverageTermStats => {
    let result: CoverageTermStats = { total: 0, covered: 0, percentage: 0 };

    if (termType === 'b') {
        result = calculateBranchesStats(term);
    } else {
        result = Object.values(term).reduce((prev, next) => {
            const result = { ...prev, total: prev.total + 1 };

            if (next > 0) {
                result.covered = prev.covered + 1;
            }

            return result;
        }, initialTermStats);
    }

    const { total, covered } = result;

    if (total !== 0) result.percentage = (covered / total) * 100;

    return result;
};

export const readCoverageReport = (
    path: string = './coverage/coverage-final.json'
): CoverageReport => {
    const coverage = JSON.parse(getFileContent(path)) as CoverageReport;
    return coverage;
};

export const getSourceFilesStats = (
    coverage: CoverageReport
): { [key: string]: SourceFileInfo } => {
    return Object.entries(coverage).reduce((prev, [path, result]) => {
        const { s, f, b } = result;
        const hash = checksum(getFileContent(path));

        return {
            ...prev,
            [path]: {
                s: calculateTermStats(s, 's'),
                f: calculateTermStats(f, 'f'),
                b: calculateTermStats(b, 'b'),
                hash,
            },
        };
    }, {});
};

export const getTestFilesChecksums = (
    testFiles: string[]
): { [key: string]: TestFileInfo } => {
    return testFiles.reduce((prev, next) => {
        return {
            ...prev,
            [next]: {
                hash: checksum(getFileContent(next)),
            },
        };
    }, {});
};

export const cacheFileExists = (): boolean => fileExists(CACHE_FILE_NAME);

export const writeCacheFile = (stats: CoverageStats) => {
    writeFile(CACHE_FILE_NAME, JSON.stringify(stats, null, ' '));
};

export const readCacheFile = (): CoverageStats => {
    if (!cacheFileExists()) throw new Error();
    return JSON.parse(getFileContent(CACHE_FILE_NAME));
};

export const getChangedFilesFromSection = (
    globFiles: string[],
    files: { [key: string]: { hash: string } }
): string[] => {
    const paths = Object.keys(files);

    const addedFiles = globFiles.filter((file) => !paths.includes(file));

    const updatedFiles = paths.filter((file) => {
        if (!fileExists(file)) return false;
        const content = getFileContent(file);
        const hash = checksum(content);

        return hash !== files[file].hash;
    });

    return [...addedFiles, ...updatedFiles];
};

export const getChangedFiles = (
    globTestFiles: string[],
    coverageStats: CoverageStats
): { testFiles: string[]; sourceFiles: string[] } => {
    const { testFiles, sourceFiles } = coverageStats;

    return {
        testFiles: getChangedFilesFromSection(globTestFiles, testFiles),
        sourceFiles: getChangedFilesFromSection([], sourceFiles),
    };
};
