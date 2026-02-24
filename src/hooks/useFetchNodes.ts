"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OSFNode, OSFFile } from "@/types/api";

export function useFetchProjects() {
  const [projects, setProjects] = useState<OSFNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { projects, loading, error, refetch: fetchData };
}

export function useFetchFiles(projectId: string, path?: string) {
  const [files, setFiles] = useState<OSFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    if (!initialLoadDone.current) setLoading(true);
    setError(null);
    try {
      const url = path
        ? `/api/files/${projectId}/${path}`
        : `/api/files/${projectId}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch files");
      }
      const data = await res.json();
      setFiles(data.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [projectId, path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { files, loading, error, refetch: fetchData };
}
