"use client";

import { use, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFetchFiles } from "@/hooks/useFetchNodes";
import { groupFilesIntoItems } from "@/types/item";
import ItemCard from "@/app/components/ItemCard";
import FileUpload from "@/app/components/FileUpload";
import Loading from "@/app/components/Loading";
import Link from "next/link";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = use(params);
  const { isAuthenticated } = useAuth();
  const { files, loading, error, refetch } = useFetchFiles(project);
  const [showUpload, setShowUpload] = useState(false);
  const [reloading, setReloading] = useState(false);

  const handleReload = useCallback(async () => {
    setReloading(true);
    await refetch();
    setReloading(false);
  }, [refetch]);

  const handleUploadComplete = useCallback(() => {
    refetch();
  }, [refetch]);

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

  const items = groupFilesIntoItems(files);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">
          トップ
        </Link>
        <span>/</span>
        <span className="text-slate-800">{project}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          アイテム一覧
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            disabled={reloading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {reloading ? "🔄 読み込み中..." : "🔄 リロード"}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {showUpload ? "✕ 閉じる" : "📤 アップロード"}
            </button>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="mb-6">
          <FileUpload
            projectId={project}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.baseName}
              item={item}
              projectId={project}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          アイテムが見つかりません
        </div>
      )}
    </div>
  );
}
