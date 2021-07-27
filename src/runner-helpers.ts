import { defaults as jestDefaults } from 'jest-config';
import fg from 'fast-glob';
import { spawnSync } from 'child_process';
import { fileExists, getFileContent } from './file-helpers';
import type { TestRunners, JestConfig, PackageContent } from './types';

export const getValueOrDefaultConfig = (
    runner: TestRunners,
    config: JestConfig,
    key: keyof JestConfig
): string | string[] => {
    if (runner === 'jest') {
        if (config[key]) {
            return config[key]!;
        }

        return jestDefaults[key];
    }

    return '';
};

export const readRunnerConfig = (
    runner: TestRunners,
    customPath?: string
): JestConfig => {
    if (runner === 'jest') {
        if (customPath) {
            if (!fileExists(customPath)) throw new Error();
            return getFileContent(customPath) as JestConfig;
        }

        const configFiles = ['./jest.config.js', './jest.config.ts'];
        const configFilePath = configFiles.find((path) => fileExists(path));

        if (configFilePath) {
            const configFile = eval(
                getFileContent(configFilePath)
            ) as JestConfig;
            return configFile;
        }

        const packageContent = JSON.parse(
            getFileContent('./package.json')
        ) as PackageContent;
        if (packageContent.jest) {
            return packageContent.jest;
        }

        return {};
    }

    return {};
};

export const getTestFiles = async (runner: TestRunners): Promise<string[]> => {
    if (runner === 'jest') {
        const config = readRunnerConfig('jest');
        const testMatch = getValueOrDefaultConfig('jest', config, 'testMatch');
        // TODO: Pick from config
        const ignorePattern = ['node_modules/**'];

        return await fg(testMatch, {
            ignore: ignorePattern,
            absolute: true,
        });
    }

    return [];
};

export const buildRunnerArgs = (
    runner: TestRunners,
    changedFiles: {
        testFiles: string[];
        sourceFiles: string[];
    }
): string[] => {
    if (runner === 'jest') {
        const { testFiles, sourceFiles } = changedFiles;
        let args: string[] = [...testFiles];

        if (sourceFiles.length) {
            args = [...args, '--findRelatedTests', ...sourceFiles];
        }

        return [...args, '--coverage', '--bail'];
    }

    return [];
};

export const spawnRunner = (runner: TestRunners, args: string[]) => {
    if (runner === 'jest') {
        spawnSync('jest', args, {
            stdio: 'inherit',
        });
    }
};
