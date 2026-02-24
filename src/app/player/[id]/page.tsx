"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import AudioPlayerComponent from "@/app/components/AudioPlayer";
import SummaryCard from "@/app/components/SummaryCard";
import Link from "next/link";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const audioUrl = searchParams.get("url") || "";
  const fileName = searchParams.get("name") || "音声ファイル";

  // Build proxy URL for audio playback (hides Bearer token)
  const proxyUrl = `/api/audio/${encodeURIComponent(audioUrl)}${projectId ? `?project=${projectId}` : ""}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">
          プロジェクト
        </Link>
        {projectId && (
          <>
            <span>/</span>
            <Link
              href={`/projects/${projectId}`}
              className="hover:text-blue-600"
            >
              {projectId}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-800">{fileName}</span>
      </div>

      {/* Audio Player */}
      <div className="mb-8">
        <AudioPlayerComponent src={proxyUrl} title={fileName} />
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <SummaryCard audioUrl={audioUrl} fileName={fileName} />
      </div>

      {/* Back Link */}
      <div className="text-center">
        {projectId ? (
          <Link
            href={`/projects/${projectId}`}
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            ← ファイル一覧に戻る
          </Link>
        ) : (
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            ← トップに戻る
          </Link>
        )}
      </div>
    </div>
  );
}
