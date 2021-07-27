#!/usr/bin/env node
import 'core-js';
import 'regenerator-runtime/runtime';
import chalk from 'chalk';
import {
    writeCacheFile,
    getChangedFiles,
    getSourceFilesStats,
    readCacheFile,
    readCoverageReport,
    getTestFilesChecksums,
    cacheFileExists,
    parseCoverageResultToTable,
    calculateCoverageResult,
    compareSourceFiles,
} from './coverage-helpers';
import { showGreetings, showTable } from './io-helpers';
import { buildRunnerArgs, getTestFiles, spawnRunner } from './runner-helpers';
import { checksum, getFileContent } from './file-helpers';

const { grey, greenBright, bold, yellowBright } = chalk;

export const performFirstRun = (globTestFiles: string[]) => {
    console.log('Cache file not found. Spawning runner...');
    console.log(`🧪 Running tests with ${grey('jest --coverage')}`);

    spawnRunner('jest', ['--coverage']);

    const report = readCoverageReport();
    const stats = getSourceFilesStats(report);

    writeCacheFile({
        testFiles: getTestFilesChecksums(globTestFiles),
        sourceFiles: stats,
    });
};

export const performSubsequentRun = (globTestFiles: string[]) => {
    console.log('🔎 Cache file found. Looking for changes...');

    const cacheData = readCacheFile();
    const changedFiles = getChangedFiles(globTestFiles, cacheData);
    const { testFiles, sourceFiles } = changedFiles;

    const mergedFiles = [...testFiles, ...sourceFiles];

    if (mergedFiles.length) {
        console.log(bold(yellowBright('Changes found on following files:\n')));

        mergedFiles.forEach((file) => {
            console.log(`• ${file}\n`);
        });

        const args = buildRunnerArgs('jest', changedFiles);
        console.log(`Running tests with ${grey(`jest ${args.join(' ')}`)}\n`);
        spawnRunner('jest', args);

        const report = readCoverageReport();
        const stats = getSourceFilesStats(report);

        // TODO: Find out how to get updated source files by tests
        cacheData.sourceFiles = compareSourceFiles(
            cacheData.sourceFiles,
            stats
        );

        cacheData.testFiles = testFiles.reduce((prev, next) => {
            return {
                ...prev,
                [next]: {
                    hash: checksum(getFileContent(next)),
                },
            };
        }, cacheData.testFiles);

        writeCacheFile(cacheData);

        console.log(bold(greenBright('✅ Changes has been saved.\n')));
    } else {
        console.log('✅ No changes were found. Showing existent results.\n');
    }
};

const main = async () => {
    showGreetings();
    const globTestFiles = await getTestFiles('jest');

    if (cacheFileExists()) {
        performSubsequentRun(globTestFiles);
    } else {
        performFirstRun(globTestFiles);
    }

    const cache = readCacheFile();
    const result = calculateCoverageResult(cache);

    showTable(
        ['Statements', 'Functions', 'Branches'],
        parseCoverageResultToTable(result)
    );
};

main();
