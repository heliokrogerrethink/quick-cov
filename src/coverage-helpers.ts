import chalk, { green } from 'chalk';
import {
    checksum,
    getFileContent,
    fileExists,
    writeFile,
    getUpdatedFilesFromList,
} from './file-helpers';
import type {
    CoverageReport,
    SourceFileInfo,
    CoverageReportTermResult,
    QuickCovTermStats,
    QuickCovReport,
    QuickCovCoverageStats,
} from './types';

const { yellowBright, redBright, greenBright, bold } = chalk;

export const CACHE_FILE_NAME = '.quick-cov-report.json';

const termsOrdering = ['s', 'f', 'b'];

export const calculateCoveredBranches = (results: number[]): number => {
    return results.reduce((prev, next) => {
        if (next === 0) return prev;
        return prev + 1;
    }, 0);
};

export const calculateBranchesStats = (
    branches: CoverageReportTermResult
): QuickCovTermStats => {
    const result = Object.values(branches).reduce(
        (prev: QuickCovTermStats, next) => {
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
    term: CoverageReportTermResult,
    termType: 's' | 'f' | 'b'
): QuickCovTermStats => {
    let result: QuickCovTermStats = { total: 0, covered: 0, percentage: 0 };

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

const initialTermStats: QuickCovTermStats = {
    total: 0,
    covered: 0,
    percentage: 0,
};

export const calculateTermSum = (
    prevStats: QuickCovTermStats,
    nextStats: QuickCovTermStats
): QuickCovTermStats => ({
    total: prevStats.total + nextStats.total,
    covered: prevStats.covered + nextStats.covered,
    percentage: 0,
});

export const calculateCoverageResult = (
    report: QuickCovReport
): QuickCovCoverageStats => {
    const { sourceFiles } = report;

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
    [key: string]: QuickCovTermStats;
}): string[] => {
    return Object.values(terms).map(
        (term) => `${term.covered} / ${term.total}`
    );
};

export const getPercentageResult = (terms: {
    [key: string]: QuickCovTermStats;
}): string[] => {
    return Object.values(terms).map((term) => `${term.percentage.toFixed(2)}%`);
};

export const getGainOrLossMessage = (
    stalePercentage: number,
    newPercentage: number
): string => {
    if (newPercentage > stalePercentage) {
        return greenBright(
            ` (+${(newPercentage - stalePercentage).toFixed(2)}%)`
        );
    }

    if (stalePercentage > newPercentage) {
        return redBright(
            ` (-${(stalePercentage - newPercentage).toFixed(2)}%)`
        );
    }

    return '';
};

export const setStatsColors =
    (
        stats: QuickCovTermStats[],
        result: QuickCovCoverageStats,
        shouldShowGainOrLoss: boolean
    ) =>
    (str: string, index: number) => {
        const term = termsOrdering[index];
        const staleStats = result[term as keyof QuickCovCoverageStats];

        const { percentage } = stats[index];

        let stat = '';
        let gainOrLoss = '';

        if (percentage < 80) stat = yellowBright(str);
        if (percentage < 50) stat = redBright(str);
        if (percentage > 80) stat = greenBright(str);

        if (shouldShowGainOrLoss) {
            gainOrLoss = getGainOrLossMessage(
                staleStats.percentage,
                percentage
            );
        }

        return bold(`${stat}${gainOrLoss}`);
    };

export const parseCoverageResultToTable = (
    stats: QuickCovCoverageStats,
    staleStats: QuickCovCoverageStats
): string[][] => {
    const { s, f, b } = stats;

    return [
        getCoveredOverTotalResult({ s, f, b }).map(
            setStatsColors([s, f, b], staleStats, false)
        ),
        getPercentageResult({ s, f, b }).map(
            setStatsColors([s, f, b], staleStats, true)
        ),
    ];
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

export const cacheFileExists = (): boolean => fileExists(CACHE_FILE_NAME);

export const writeCacheFile = (stats: QuickCovReport) => {
    writeFile(CACHE_FILE_NAME, JSON.stringify(stats, null, ' '));
};

export const readCacheFile = (): QuickCovReport => {
    if (!cacheFileExists()) throw new Error();
    return JSON.parse(getFileContent(CACHE_FILE_NAME));
};

export const getChangedFiles = (
    testFiles: string[],
    coverageStats: QuickCovReport
): { testFiles: string[]; sourceFiles: string[] } => {
    return {
        testFiles: getUpdatedFilesFromList(coverageStats.testFiles, testFiles),
        sourceFiles: getUpdatedFilesFromList(coverageStats.sourceFiles, []),
    };
};
