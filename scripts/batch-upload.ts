/**
 * Batch upload script for GakuNin RDM
 *
 * Usage:
 *   npx tsx scripts/batch-upload.ts --dir <path> --project <id> --token <token>
 *
 * Options:
 *   --dir       Directory containing files to upload
 *   --project   GakuNin RDM project ID
 *   --token     Personal access token
 *   --provider  Storage provider (default: osfstorage)
 *   --ext       File extensions to include, comma-separated (default: .mp3,.txt)
 *   --delay     Delay between uploads in ms (default: 1000)
 */

import * as fs from "fs";
import * as path from "path";

const FILES_API = "https://files.rdm.nii.ac.jp/v1/resources";

interface UploadResult {
  fileName: string;
  size: number;
  status: "success" | "error";
  error?: string;
}

function parseArgs(): {
  dir: string;
  project: string;
  token: string;
  provider: string;
  extensions: string[];
  delay: number;
} {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    opts[key] = args[i + 1];
  }

  if (!opts.dir || !opts.project || !opts.token) {
    console.error(
      "Usage: npx tsx scripts/batch-upload.ts --dir <path> --project <id> --token <token>"
    );
    console.error("\nOptions:");
    console.error("  --dir       Directory containing files to upload");
    console.error("  --project   GakuNin RDM project ID");
    console.error("  --token     Personal access token");
    console.error("  --provider  Storage provider (default: osfstorage)");
    console.error("  --ext       File extensions, comma-separated (default: .mp3,.txt)");
    console.error("  --delay     Delay between uploads in ms (default: 1000)");
    process.exit(1);
  }

  return {
    dir: path.resolve(opts.dir),
    project: opts.project,
    token: opts.token,
    provider: opts.provider || "osfstorage",
    extensions: (opts.ext || ".mp3,.txt").split(",").map((e) => (e.startsWith(".") ? e : `.${e}`)),
    delay: parseInt(opts.delay || "1000", 10),
  };
}

function discoverFiles(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(dir);
  return entries
    .filter((name) => {
      const ext = path.extname(name).toLowerCase();
      return extensions.includes(ext);
    })
    .map((name) => path.join(dir, name))
    .sort();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadFile(
  filePath: string,
  projectId: string,
  token: string,
  provider: string
): Promise<Response> {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const url = `${FILES_API}/${projectId}/providers/${provider}/?kind=file&name=${encodeURIComponent(fileName)}`;

  return fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });
}

async function main() {
  const { dir, project, token, provider, extensions, delay } = parseArgs();

  console.log(`\n📁 Directory: ${dir}`);
  console.log(`📋 Project:   ${project}`);
  console.log(`💾 Provider:  ${provider}`);
  console.log(`📎 Extensions: ${extensions.join(", ")}`);
  console.log(`⏱  Delay:     ${delay}ms\n`);

  const files = discoverFiles(dir, extensions);

  if (files.length === 0) {
    console.log("No matching files found.");
    return;
  }

  console.log(`Found ${files.length} file(s):\n`);
  let totalSize = 0;
  for (const f of files) {
    const stat = fs.statSync(f);
    totalSize += stat.size;
    console.log(`  ${path.basename(f)} (${formatSize(stat.size)})`);
  }
  console.log(`\n  Total: ${formatSize(totalSize)}\n`);
  console.log("---\n");

  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);

    process.stdout.write(
      `[${i + 1}/${files.length}] Uploading ${fileName} (${formatSize(stat.size)})... `
    );

    try {
      const res = await uploadFile(filePath, project, token, provider);

      if (!res.ok) {
        const errorText = await res.text();
        console.log(`FAILED (HTTP ${res.status})`);
        results.push({
          fileName,
          size: stat.size,
          status: "error",
          error: `HTTP ${res.status}: ${errorText.slice(0, 200)}`,
        });
      } else {
        console.log("OK");
        results.push({ fileName, size: stat.size, status: "success" });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.log(`FAILED (${msg})`);
      results.push({ fileName, size: stat.size, status: "error", error: msg });
    }

    // Delay between uploads
    if (i < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Summary
  const succeeded = results.filter((r) => r.status === "success");
  const failed = results.filter((r) => r.status === "error");

  console.log("\n===  Summary  ===\n");
  console.log(`Total:     ${results.length}`);
  console.log(`Succeeded: ${succeeded.length}`);
  console.log(`Failed:    ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed files:");
    for (const f of failed) {
      console.log(`  - ${f.fileName}: ${f.error}`);
    }
  }

  console.log();
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
