import * as core from '@actions/core';
import * as github from '@actions/github';

import { getBranchOfCurrentWorkflow, isDefaultBranch, isHotfixBranch } from './branches';
import { GitVersionReader } from './version/GitVersion';
import { NpmVersionReader } from './version/NpmVersion';
import { getNextSemVer } from './version/Version';

export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('token');
    const devVersionSuffix = core.getInput('dev-version-suffix');

    const workflowBranch = getBranchOfCurrentWorkflow(github.context);
    const workflowOnDefaultBranch = await isDefaultBranch(
      workflowBranch,
      github.context,
      githubToken
    );
    const workflowOnHotfixBranch = isHotfixBranch(workflowBranch);

    const gitVersion = await new GitVersionReader().getVersion();
    const packageFileVersion = await new NpmVersionReader('./package.json').getVersion();

    const addDevSuffix = !workflowOnHotfixBranch && !workflowOnDefaultBranch;
    const semver =
      getNextSemVer(gitVersion, packageFileVersion, workflowOnHotfixBranch) +
      (addDevSuffix ? `-${devVersionSuffix}` : '');

    console.log(`Branch: ${workflowBranch}`);
    console.log(`Latest Git Version: ${gitVersion.getVersion()}`);
    console.log(`Latest Package File Version: ${packageFileVersion.getVersion()}`);
    console.log(`Next Semantic Version: ${semver}`);

    core.setOutput('semver', semver);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
