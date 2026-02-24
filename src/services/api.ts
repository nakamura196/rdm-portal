import {
  OSFNodesResponse,
  OSFFilesResponse,
  OSFStorageResponse,
} from "@/types/api";

const API_BASE = "https://api.rdm.nii.ac.jp/v2";

async function fetchWithAuth(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProjects(
  accessToken: string,
  page = 1,
  perPage = 10
): Promise<OSFNodesResponse> {
  return fetchWithAuth(
    `${API_BASE}/users/me/nodes/?page=${page}&per_page=${perPage}`,
    accessToken
  );
}

export async function fetchStorages(
  accessToken: string,
  projectId: string
): Promise<OSFStorageResponse> {
  return fetchWithAuth(
    `${API_BASE}/nodes/${projectId}/files/`,
    accessToken
  );
}

export async function fetchFiles(
  accessToken: string,
  filesUrl: string
): Promise<OSFFilesResponse> {
  return fetchWithAuth(filesUrl, accessToken);
}

export async function fetchProjectFiles(
  accessToken: string,
  projectId: string,
  provider = "osfstorage"
): Promise<OSFFilesResponse> {
  return fetchWithAuth(
    `${API_BASE}/nodes/${projectId}/files/${provider}/`,
    accessToken
  );
}

export async function fetchFolderContents(
  accessToken: string,
  folderUrl: string
): Promise<OSFFilesResponse> {
  return fetchWithAuth(folderUrl, accessToken);
}

export async function uploadFile(
  accessToken: string,
  projectId: string,
  fileName: string,
  fileData: ArrayBuffer,
  provider = "osfstorage"
): Promise<Response> {
  const url = `https://files.rdm.nii.ac.jp/v1/resources/${projectId}/providers/${provider}/?kind=file&name=${encodeURIComponent(fileName)}`;
  return fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: fileData,
  });
}

export interface BatchUploadProgress {
  fileName: string;
  index: number;
  total: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export async function uploadFilesBatch(
  projectId: string,
  files: File[],
  onProgress?: (progress: BatchUploadProgress) => void,
  provider = "osfstorage"
): Promise<{ completed: number; failed: number; results: BatchUploadProgress[] }> {
  const results: BatchUploadProgress[] = [];
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress: BatchUploadProgress = {
      fileName: file.name,
      index: i,
      total: files.length,
      status: "uploading",
    };
    onProgress?.(progress);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("provider", provider);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        progress.status = "error";
        progress.error = err.error || `HTTP ${res.status}`;
        failed++;
      } else {
        progress.status = "success";
        completed++;
      }
    } catch (error) {
      progress.status = "error";
      progress.error = error instanceof Error ? error.message : "Unknown error";
      failed++;
    }

    results.push(progress);
    onProgress?.(progress);

    // 1-second delay between uploads to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { completed, failed, results };
}
