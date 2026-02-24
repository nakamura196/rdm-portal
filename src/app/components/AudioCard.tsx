"use client";

import Link from "next/link";
import { OSFFile } from "@/types/api";

interface AudioCardProps {
  file: OSFFile;
  projectId: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "不明";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

export default function AudioCard({ file, projectId }: AudioCardProps) {
  const fileId = encodeURIComponent(file.id);
  // file.links.download is a web UI URL that doesn't support Bearer auth.
  // Use WaterButler URL (file.links.move) which supports API token auth.
  const downloadUrl = file.links.move || file.links.download || "";

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-slate-100">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 text-blue-600 rounded-lg p-3 text-2xl flex-shrink-0">
            🎵
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-lg">
              {file.attributes.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>{formatFileSize(file.attributes.size)}</span>
              {file.attributes.date_modified && (
                <span>{formatDate(file.attributes.date_modified)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/player/${fileId}?project=${projectId}&url=${encodeURIComponent(downloadUrl)}&name=${encodeURIComponent(file.attributes.name)}`}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center py-2 rounded-lg text-sm font-medium transition"
          >
            ▶ 再生・要約
          </Link>
        </div>
      </div>
    </div>
  );
}
