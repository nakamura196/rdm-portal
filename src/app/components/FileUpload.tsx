"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from "react";

interface FileUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

export default function FileUpload({
  projectId,
  onUploadComplete,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setProgress(`${file.name} をアップロード中...`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "アップロードに失敗しました");
        }

        setProgress(`${file.name} のアップロードが完了しました`);
        onUploadComplete();
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setUploading(false);
      }
    },
    [projectId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        {uploading ? (
          <div>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3" />
            <p className="text-slate-600">{progress}</p>
          </div>
        ) : (
          <div>
            <span className="text-4xl block mb-3">📤</span>
            <p className="text-slate-600 mb-2">
              ファイルをドラッグ&ドロップ
            </p>
            <p className="text-sm text-slate-400 mb-4">または</p>
            <label className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer transition text-sm font-medium">
              ファイルを選択
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!uploading && progress && !error && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          {progress}
        </div>
      )}
    </div>
  );
}
