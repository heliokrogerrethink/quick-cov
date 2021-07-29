export type CoverageReportTermResult = {
    [key: string]: number | number[];
};

export type CoverageReportResult = {
    s: CoverageReportTermResult;
    f: CoverageReportTermResult;
    b: CoverageReportTermResult;
};

export type CoverageReport = {
    [key: string]: CoverageReportResult;
};

export type FileInfo = {
    hash: string;
};

export type QuickCovTermStats = {
    total: number;
    covered: number;
    percentage: number;
};

export type QuickCovCoverageStats = {
    s: QuickCovTermStats;
    f: QuickCovTermStats;
    b: QuickCovTermStats;
};

export interface SourceFileInfo extends QuickCovCoverageStats, FileInfo {}

export type QuickCovReport = {
    sourceFiles: {
        [key: string]: SourceFileInfo;
    };
    testFiles: {
        [key: string]: FileInfo;
    };
    firstRunElapsedTime: number;
};
