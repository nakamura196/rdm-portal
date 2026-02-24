export interface OSFNode {
  id: string;
  type: string;
  attributes: {
    title: string;
    description?: string;
    category?: string;
    date_created: string;
    date_modified: string;
    public: boolean;
    tags: string[];
    current_user_can_comment: boolean;
    current_user_permissions: string[];
  };
  relationships?: {
    contributors?: {
      links: { related: { href: string } };
    };
    files?: {
      links: { related: { href: string } };
    };
  };
  links: {
    self: string;
    html: string;
  };
}

export interface OSFNodesResponse {
  data: OSFNode[];
  links: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
    meta?: { total: number; per_page: number };
  };
}

export interface OSFFile {
  id: string;
  type: string;
  attributes: {
    name: string;
    kind: "file" | "folder";
    path: string;
    size?: number;
    materialized_path: string;
    date_modified?: string;
    date_created?: string;
    provider: string;
    last_touched?: string;
    extra?: {
      hashes?: {
        md5?: string;
        sha256?: string;
      };
    };
  };
  relationships?: {
    files?: {
      links: { related: { href: string } };
    };
  };
  links: {
    self: string;
    html?: string;
    upload?: string;
    download?: string;
    move?: string;
    delete?: string;
  };
}

export interface OSFFilesResponse {
  data: OSFFile[];
  links: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface OSFStorage {
  id: string;
  type: string;
  attributes: {
    name: string;
    kind: string;
    node: string;
    path: string;
    provider: string;
  };
  relationships: {
    files: {
      links: { related: { href: string } };
    };
  };
  links: {
    self: string;
    html?: string;
    upload?: string;
    download?: string;
  };
}

export interface OSFStorageResponse {
  data: OSFStorage[];
}

export const AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".m4a",
  ".wma",
  ".webm",
];

export function isAudioFile(name: string): boolean {
  const lower = name.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export interface BatchUploadResult {
  fileName: string;
  status: "success" | "error";
  error?: string;
  size?: number;
}

export interface BatchUploadResponse {
  totalFiles: number;
  completed: number;
  failed: number;
  results: BatchUploadResult[];
}
