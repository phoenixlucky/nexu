import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { prepareOpenclawRuntimeStage, repoRootPath } from "@nexu/dev-utils";

import { resolveOpenClawRepoLocalLayout } from "./repo-local-layout.js";

const DEV_RUNTIME_MANIFEST_FILENAME = "manifest.json";

type StageLog = (message: string) => void;

type PreparedDevOpenclawManifest = {
  fingerprint: string;
  patchedFileCount: number;
  createdAt: string;
};

export type PreparedDevOpenclawLayout = {
  preparedRoot: string;
  manifestPath: string;
  entryPath: string;
  builtinExtensionsDir: string;
  stagedOpenclawRoot: string;
  sourceRoot: string;
  patchRoot: string;
  fingerprint: string;
  patchedFileCount: number;
  reused: boolean;
};

export function getPreparedDevOpenclawRoot(): string {
  return join(
    repoRootPath,
    "openclaw-runtime",
    "node_modules",
    ".nexu-dev-runtime",
  );
}

export function getPreparedDevOpenclawManifestPath(): string {
  return join(getPreparedDevOpenclawRoot(), DEV_RUNTIME_MANIFEST_FILENAME);
}

export async function prepareRepoLocalDevOpenclawRuntime(options?: {
  log?: StageLog;
}): Promise<PreparedDevOpenclawLayout> {
  const layout = resolveOpenClawRepoLocalLayout();
  const preparedRoot = getPreparedDevOpenclawRoot();
  const stage = await prepareOpenclawRuntimeStage({
    sourceOpenclawRoot: layout.openclawStageSourceRootPath,
    patchRoot: layout.openclawPatchRootPath,
    targetStageRoot: preparedRoot,
    log: options?.log,
  });

  return {
    preparedRoot,
    manifestPath: getPreparedDevOpenclawManifestPath(),
    entryPath: join(stage.stagedOpenclawRoot, "openclaw.mjs"),
    builtinExtensionsDir: join(stage.stagedOpenclawRoot, "extensions"),
    stagedOpenclawRoot: stage.stagedOpenclawRoot,
    sourceRoot: layout.openclawStageSourceRootPath,
    patchRoot: layout.openclawPatchRootPath,
    fingerprint: stage.fingerprint,
    patchedFileCount: stage.patchedFileCount,
    reused: stage.reused,
  };
}

export async function readPreparedDevOpenclawManifest(): Promise<PreparedDevOpenclawManifest> {
  const manifestSource = await readFile(
    getPreparedDevOpenclawManifestPath(),
    "utf8",
  );
  return JSON.parse(manifestSource) as PreparedDevOpenclawManifest;
}

export function resolvePreparedDevOpenclawLayout(): PreparedDevOpenclawLayout {
  const preparedRoot = getPreparedDevOpenclawRoot();
  const stagedOpenclawRoot = join(preparedRoot, "openclaw");
  const manifestPath = getPreparedDevOpenclawManifestPath();
  const sourceLayout = resolveOpenClawRepoLocalLayout();

  return {
    preparedRoot,
    manifestPath,
    entryPath: join(stagedOpenclawRoot, "openclaw.mjs"),
    builtinExtensionsDir: join(stagedOpenclawRoot, "extensions"),
    stagedOpenclawRoot,
    sourceRoot: sourceLayout.openclawStageSourceRootPath,
    patchRoot: sourceLayout.openclawPatchRootPath,
    fingerprint: "",
    patchedFileCount: 0,
    reused: false,
  };
}
