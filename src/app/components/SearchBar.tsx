"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { OSFFile } from "@/types/api";

interface SearchBarProps {
  files: OSFFile[];
  onResults: (results: OSFFile[]) => void;
}

export default function SearchBar({ files, onResults }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(files, {
        keys: ["attributes.name", "attributes.materialized_path"],
        threshold: 0.4,
        includeScore: true,
      }),
    [files]
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      onResults(files);
      return;
    }
    const results = fuse.search(value);
    onResults(results.map((r) => r.item));
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="ファイル名で検索..."
        className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-slate-700"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        🔍
      </span>
      {query && (
        <button
          onClick={() => handleSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
