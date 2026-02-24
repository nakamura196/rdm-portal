"use client";

import Link from "next/link";
import { ItemGroup } from "@/types/item";

interface ItemCardProps {
  item: ItemGroup;
  projectId: string;
}

export default function ItemCard({ item, projectId }: ItemCardProps) {
  const hasJa = !!(item.jaAudio || item.jaText);
  const hasEn = !!(item.enAudio || item.enText);

  return (
    <Link
      href={`/projects/${projectId}/items/${encodeURIComponent(item.baseName)}`}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-slate-100"
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 text-blue-600 rounded-lg p-3 text-2xl flex-shrink-0">
            📚
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-lg">
              {item.baseName}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {hasEn && (
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">
                  EN
                </span>
              )}
              {hasJa && (
                <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded font-medium">
                  JA
                </span>
              )}
              {item.enAudio && (
                <span className="text-xs text-slate-400">🎵 音声あり</span>
              )}
              {item.enText && (
                <span className="text-xs text-slate-400">📄 テキストあり</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
