# @rethink/quick-cov

A powerful helper to run your coverage reports.

---

## Purpose

Tracking coverage reports in big projects are extremely slow. And if you are aiming a crescendely grow of your tracking stats, this process may be annoying. quick-cov provides very useful set of tools to quicken this process up.

## Features

-   **Track down only updated source and test files** -- quick-cov provides a smart caching tool that decides whom to test / capture coverage reports. Whenever a tiny test file was updated, quick-cov will track it down and perform a test command specially for it.
-   **Shows helpful stats from your test runs** -- quick-cov can show stats about gain or loss on each of your code coverage methods (statements, branches and functions).

## Limitations

-   Does not support coverage to lines yet.
-   Requires Jest global installation

## Installing

Using npm:

```bash
npm install -g quick-cov
```

Or using yarn:

```bash
yarn add global quick-cov
```

## Using

To perform a quick-cov, just run:

```bash
quick-cov
```
