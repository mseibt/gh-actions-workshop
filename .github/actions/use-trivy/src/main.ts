import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';

export async function run(): Promise<void> {
  try {
    const trivyVersion = core.getInput('trivy-version');

    const cacheKey = `trivy-${trivyVersion}`;
    const cachePath = path.join(process.env['RUNNER_TEMP'] || '', 'trivy');

    let pathToTrivy: string | undefined = '';
    pathToTrivy = await cache.restoreCache([cachePath], cacheKey);
    if (pathToTrivy) {
      core.info(`Trivy restored from cache: ${pathToTrivy}`);
    } else {
      const url = `https://github.com/aquasecurity/trivy/releases/download/v${trivyVersion}/trivy_${trivyVersion}_Linux-64bit.tar.gz`;
      core.info(`Download Trivy from: ${url}`);
      const pathToTrivyPackage = await tc.downloadTool(url);
      pathToTrivy = await tc.extractTar(pathToTrivyPackage, cachePath);
      core.info(`Safe Trivy in cache with key ${cacheKey} in locaton ${cachePath}`);
      await cache.saveCache([cachePath], cacheKey);
    }
    core.addPath(cachePath);

    const files = fs.readdirSync(cachePath);
    core.debug(`Files in Trivy path (${cachePath}): ${files.join(', ')}`);

    // Debug: Output all paths in the PATH environment variable
    const pathEnv = process.env['PATH'] || '';
    core.debug(`PATH environment variable: ${pathEnv.split(path.delimiter).join('\n')}`);

    await exec.exec('trivy', ['--version']);

    await exec.exec('trivy', ['fs', '.']);

    console.log(`Trivy version: ${trivyVersion}`);
    console.log(`Trivy path: ${pathToTrivy}`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
