#!/usr/bin/env node
import 'core-js';
import 'regenerator-runtime/runtime';
import chalk from 'chalk';
import { cloneDeep } from 'lodash';
import { showGreetings, showTable } from './io-helpers';
import {
    buildRunnerArgs,
    getSourceFilesFromTestFile,
    getTestFiles,
    spawnRunner,
} from './runner-helpers';
import { getFilesChecksums, getUpdatedFilesFromList } from './file-helpers';
import {
    cacheFileExists,
    calculateCoverageResult,
    getChangedFiles,
    getSourceFilesStats,
    parseCoverageResultToTable,
    readCacheFile,
    readCoverageReport,
    writeCacheFile,
} from './coverage-helpers';

const { grey, bold, yellowBright } = chalk;

let elapsedTime: number;

export const getElapsedSeconds = (startDate: Date, endDate: Date): number => {
    const diff: number = Number(endDate) - Number(startDate);
    return diff / 1000;
};

export const performFirstRun = (testFiles: string[]) => {
    console.log('Cache file not found. Spawning runner...');
    console.log(`🧪 Running tests with ${grey('jest --coverage')}`);

    const startDate = new Date();

    spawnRunner(buildRunnerArgs([], []));

    const endDate = new Date();

    const report = readCoverageReport();
    const stats = getSourceFilesStats(report);

    elapsedTime = getElapsedSeconds(startDate, endDate);

    writeCacheFile({
        testFiles: getFilesChecksums(testFiles),
        sourceFiles: stats,
        firstRunElapsedTime: elapsedTime,
    });
};

export const performSubsequentRun = async (testFiles: string[]) => {
    const startDate = new Date();

    console.log('🔎 Cache file found. Looking for changes...');
    const cacheData = readCacheFile();

    const changedFiles = getChangedFiles(testFiles, cacheData);
    const allChangedFiles = [
        ...changedFiles.sourceFiles,
        ...changedFiles.testFiles,
    ];

    if (allChangedFiles.length) {
        console.log(bold(yellowBright('Changes found on following files:')));

        allChangedFiles.forEach((path) => {
            console.log(`• ${yellowBright(path)}`);
        });

        const args = buildRunnerArgs(
            changedFiles.testFiles,
            changedFiles.sourceFiles
        );

        console.log(`Running tests with ${grey(`jest ${args.join(' ')}`)}`);

        spawnRunner(args);

        console.log(
            `Doing quick-cov's magic... ${grey(
                '(this process may take a little while)'
            )}`
        );

        const report = readCoverageReport();
        const stats = getSourceFilesStats(report);

        const updatedSourceFilesByTestFiles = (
            await Promise.all(
                changedFiles.testFiles.map(async (path) => {
                    return await getSourceFilesFromTestFile(path);
                })
            )
        ).flat();

        const updatedSourceFilesByHash = getUpdatedFilesFromList(
            cacheData.sourceFiles,
            Object.keys(stats)
        );

        const updatedSourceFiles = Array.from(
            new Set([
                ...updatedSourceFilesByTestFiles,
                ...updatedSourceFilesByHash,
            ])
        );

        const newCache = cloneDeep(cacheData);

        newCache.sourceFiles = updatedSourceFiles.reduce((prev, next) => {
            return {
                ...prev,
                [next]: stats[next],
            };
        }, newCache.sourceFiles);

        newCache.testFiles = getFilesChecksums(testFiles);

        writeCacheFile(newCache);

        console.log('✅ Updates written. Showing results.');

        const { firstRunElapsedTime } = newCache;

        console.log(
            `quick-cov saved you ${(firstRunElapsedTime - elapsedTime).toFixed(
                2
            )}s.`
        );
    } else {
        console.log('✅ No changes were found. Showing existent results.');
    }

    const endDate = new Date();

    elapsedTime = getElapsedSeconds(startDate, endDate);
};

const main = async () => {
    showGreetings();
    const testFiles = await getTestFiles();

    if (cacheFileExists()) {
        const staleCache = readCacheFile();
        const staleResult = calculateCoverageResult(staleCache);

        await performSubsequentRun(testFiles);

        const updatedCache = readCacheFile();
        const updatedResult = calculateCoverageResult(updatedCache);

        showTable(
            ['Statements', 'Functions', 'Branches'],
            parseCoverageResultToTable(updatedResult, staleResult)
        );
    } else {
        performFirstRun(testFiles);
        console.log('✅ Cache file written. Subsequents will be faster.');
    }

    console.log(`✨ Done in ${elapsedTime.toFixed(2)}s.`);
};

main();
