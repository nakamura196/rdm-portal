import { OSFFile } from "./api";

export interface ItemGroup {
  baseName: string;
  enAudio?: OSFFile;
  enText?: OSFFile;
  jaAudio?: OSFFile;
  jaText?: OSFFile;
}

/**
 * Group files by base name.
 * e.g. "2507.08853v1.mp3", "2507.08853v1_ja.txt" → baseName "2507.08853v1"
 */
export function groupFilesIntoItems(files: OSFFile[]): ItemGroup[] {
  const map = new Map<string, ItemGroup>();

  for (const file of files) {
    if (file.attributes.kind !== "file") continue;
    const name = file.attributes.name;

    // Determine extension and stem (use last dot to handle names like "2507.08853v1.mp3")
    const dotIdx = name.lastIndexOf(".");
    if (dotIdx === -1) continue;
    const stem = name.substring(0, dotIdx);
    const ext = name.substring(dotIdx + 1).toLowerCase();

    // Skip non-content files
    if (ext === "json") continue;

    const isJa = stem.endsWith("_ja");
    const baseName = isJa ? stem.slice(0, -3) : stem;
    const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext);
    const isText = ext === "txt";

    if (!isAudio && !isText) continue;

    if (!map.has(baseName)) {
      map.set(baseName, { baseName });
    }
    const group = map.get(baseName)!;

    if (isAudio && isJa) group.jaAudio = file;
    else if (isAudio) group.enAudio = file;
    else if (isText && isJa) group.jaText = file;
    else if (isText) group.enText = file;
  }

  return Array.from(map.values());
}
