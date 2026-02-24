"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetchFiles } from "@/hooks/useFetchNodes";
import { groupFilesIntoItems, ItemGroup } from "@/types/item";
import AudioPlayerComponent from "@/app/components/AudioPlayer";
import SummaryCard from "@/app/components/SummaryCard";
import Loading from "@/app/components/Loading";
import Link from "next/link";

function buildProxyUrl(file: { links: { move?: string } }, projectId: string) {
  const url = file.links.move || "";
  return `/api/audio/${encodeURIComponent(url)}?project=${projectId}`;
}

function TextViewer({ proxyUrl, label }: { proxyUrl: string; label: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(proxyUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => setText(t))
      .catch(() => setText(null))
      .finally(() => setLoading(false));
  }, [proxyUrl]);

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 animate-pulse h-32" />
    );
  }

  if (!text) return null;

  return (
    <details className="border border-slate-200 rounded-lg">
      <summary className="px-4 py-3 cursor-pointer hover:bg-slate-50 text-sm font-medium text-slate-700">
        📄 {label}
      </summary>
      <div className="px-4 pb-4 text-sm text-slate-600 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
        {text}
      </div>
    </details>
  );
}

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ project: string; item: string }>;
}) {
  const { project, item: itemEncoded } = use(params);
  const itemName = decodeURIComponent(itemEncoded);
  const { isAuthenticated } = useAuth();
  const { files, loading, error } = useFetchFiles(project);

  if (loading) {
    return <Loading message="読み込み中..." />;
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

  const items = groupFilesIntoItems(files);
  const item = items.find((i) => i.baseName === itemName);

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-50 rounded-lg p-6 text-center">
          <p className="text-slate-500">アイテムが見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">
          トップ
        </Link>
        <span>/</span>
        <Link href={`/projects/${project}`} className="hover:text-blue-600">
          {project}
        </Link>
        <span>/</span>
        <span className="text-slate-800">{itemName}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-8">{itemName}</h1>

      {/* English Section */}
      {(item.enAudio || item.enText) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">
              EN
            </span>
            English
          </h2>
          <div className="space-y-4">
            {item.enAudio && (
              <AudioPlayerComponent
                src={buildProxyUrl(item.enAudio, project)}
                title={`${itemName} (English)`}
              />
            )}
            {item.enText && (
              <TextViewer
                proxyUrl={buildProxyUrl(item.enText, project)}
                label="英語テキスト"
              />
            )}
          </div>
        </section>
      )}

      {/* Japanese Section */}
      {(item.jaAudio || item.jaText) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">
              JA
            </span>
            日本語
          </h2>
          <div className="space-y-4">
            {item.jaAudio && (
              <AudioPlayerComponent
                src={buildProxyUrl(item.jaAudio, project)}
                title={`${itemName} (日本語)`}
              />
            )}
            {item.jaText && (
              <TextViewer
                proxyUrl={buildProxyUrl(item.jaText, project)}
                label="日本語テキスト"
              />
            )}
          </div>
        </section>
      )}

      {/* AI Summary - only for authenticated users */}
      {item.enAudio && (
        <div className="mb-8">
          <SummaryCard
            audioUrl={item.enAudio.links.move || ""}
            fileName={itemName}
          />
        </div>
      )}

      {/* Back Link */}
      <div className="text-center">
        <Link
          href={`/projects/${project}`}
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          ← アイテム一覧に戻る
        </Link>
      </div>
    </div>
  );
}
