export type CoverageTermResult = {
    [key: string]: number | number[];
};

export type CoverageReport = {
    [key: string]: {
        s: CoverageTermResult;
        f: CoverageTermResult;
        b: CoverageTermResult;
    };
};

export type CoverageTermStats = {
    total: number;
    covered: number;
    percentage: number;
};

export type SourceFileInfo = {
    s: CoverageTermStats;
    f: CoverageTermStats;
    b: CoverageTermStats;
    hash: string;
};

export type TestFileInfo = Pick<SourceFileInfo, 'hash'>;

export type CoverageStats = {
    sourceFiles: {
        [key: string]: SourceFileInfo;
    };
    testFiles: {
        [key: string]: TestFileInfo;
    };
};

export type TestRunners = 'jest';

export type JestConfig = {
    testMatch?: string[];
    testPathIgnorePatterns?: string[];
    testRegex?: string | string[];
};

export type PackageContent = {
    jest: JestConfig;
};
