"use client";

import { use, useState, useCallback } from "react";
import { useFetchFiles } from "@/hooks/useFetchNodes";
import { OSFFile, isAudioFile } from "@/types/api";
import AudioCard from "@/app/components/AudioCard";
import SearchBar from "@/app/components/SearchBar";
import Loading from "@/app/components/Loading";
import Link from "next/link";

export default function FileBrowserPage({
  params,
}: {
  params: Promise<{ project: string; path: string[] }>;
}) {
  const { project, path } = use(params);
  const fullPath = path.join("/");
  const { files, loading, error } = useFetchFiles(project, fullPath);
  const [filteredFiles, setFilteredFiles] = useState<OSFFile[] | null>(null);

  const displayFiles = filteredFiles ?? files;
  const audioFiles = displayFiles.filter(
    (f) => f.attributes.kind === "file" && isAudioFile(f.attributes.name)
  );
  const otherFiles = displayFiles.filter(
    (f) => f.attributes.kind === "file" && !isAudioFile(f.attributes.name)
  );
  const folders = displayFiles.filter((f) => f.attributes.kind === "folder");

  if (loading) {
    return <Loading message="ファイルを読み込み中..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 flex-wrap">
        <Link href="/" className="hover:text-blue-600">
          プロジェクト
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${project}`}
          className="hover:text-blue-600"
        >
          {project}
        </Link>
        {path.map((segment, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            <span className={i === path.length - 1 ? "text-slate-800" : ""}>
              {decodeURIComponent(segment)}
            </span>
          </span>
        ))}
      </div>

      <div className="mb-6">
        <SearchBar
          files={files}
          onResults={(results) => setFilteredFiles(results)}
        />
      </div>

      {audioFiles.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            🎵 音声ファイル ({audioFiles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioFiles.map((file) => (
              <AudioCard key={file.id} file={file} projectId={project} />
            ))}
          </div>
        </section>
      )}

      {folders.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">
            📁 フォルダ ({folders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/projects/${project}/${fullPath}/${encodeURIComponent(folder.attributes.name)}`}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center gap-3 border border-slate-100"
              >
                <span className="text-2xl">📁</span>
                <span className="font-medium text-slate-700">
                  {folder.attributes.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {otherFiles.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">
            📄 その他のファイル ({otherFiles.length})
          </h3>
          <div className="bg-white rounded-lg shadow border border-slate-100 divide-y divide-slate-100">
            {otherFiles.map((file) => (
              <div
                key={file.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">📄</span>
                  <span className="text-slate-700">
                    {file.attributes.name}
                  </span>
                </div>
                <span className="text-sm text-slate-400">
                  {file.attributes.size
                    ? `${(file.attributes.size / 1024).toFixed(1)} KB`
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {displayFiles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          ファイルが見つかりません
        </div>
      )}
    </div>
  );
}
