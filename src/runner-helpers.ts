import { spawnSync, exec } from 'child_process';
import { SearchSource } from 'jest';
import Runtime from 'jest-runtime';
import type { Config } from '@jest/types';
import { normalize } from 'jest-config';
import { getSourceFilesStats, readCoverageReport } from './coverage-helpers';

export const buildRunnerArgs = (
    testFiles: string[],
    sourceFiles: string[]
): string[] => {
    let args: string[] = [...testFiles];

    if (sourceFiles.length) {
        args = [...args, '--findRelatedTests', ...sourceFiles];
    }

    return [...args, '--coverage', '--bail'];
};

export const spawnRunner = (args: string[]) => {
    spawnSync('jest', args, {
        stdio: 'inherit',
    });
};

export const getTestFiles = (): Promise<string[]> => {
    return new Promise((resolve) => {
        exec('jest --listTests', (err, stdout) => {
            if (err) throw err;

            const result = stdout
                .split('\n')
                .filter((testFile) => testFile !== '');

            resolve(result);
        });
    });
};

export const getTestFilesFromSourceFile = async (
    searchSource: SearchSource,
    path: string
) => {
    return await searchSource.findRelatedTestsFromPattern([path], false);
};

export const getTestFilesFromSourceFiles = async (
    sourceFiles: string[]
): Promise<{ [key: string]: string[] }> => {
    const { options } = await normalize(
        {
            rootDir: '.',
        },
        {} as Config.Argv
    );

    const context = await Runtime.createContext(options, {
        maxWorkers: 1,
        watchman: false,
    });
    const searchSource = new SearchSource(context);

    return new Promise((resolve) => {
        const iterateOverSourceFile = async (
            result: { [key: string]: string[] } = {},
            index: number = 0
        ) => {
            const sourceFile = sourceFiles[index];

            const searchResult = await getTestFilesFromSourceFile(
                searchSource,
                sourceFile
            );

            const testFiles = searchResult.tests.map((test) => test.path);
            result = { ...result, [sourceFile]: testFiles };

            if (index === sourceFiles.length - 1) {
                resolve(result);
            } else {
                iterateOverSourceFile(result, index + 1);
            }
        };

        iterateOverSourceFile();
    });
};

export const getSourceFilesFromTestFile = async (path: string) => {
    const report = readCoverageReport();
    const stats = getSourceFilesStats(report);

    const sourceFiles = await getTestFilesFromSourceFiles(Object.keys(stats));

    return Object.entries(sourceFiles).reduce<string[]>(
        (prev, [key, value]) => {
            if (value.includes(path)) {
                return [...prev, key];
            }

            return prev;
        },
        []
    );
};
