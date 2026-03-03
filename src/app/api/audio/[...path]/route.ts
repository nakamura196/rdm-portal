import { NextRequest, NextResponse } from "next/server";
import { resolveToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const projectId = request.nextUrl.searchParams.get("project") || undefined;

  const result = await resolveToken(projectId);
  if (!result) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { path } = await params;
  const downloadUrl = decodeURIComponent(path.join("/"));

  // Validate URL host to prevent SSRF
  try {
    const parsed = new URL(downloadUrl);
    const allowedHosts = ["files.rdm.nii.ac.jp", "rdm.nii.ac.jp"];
    if (!allowedHosts.includes(parsed.hostname)) {
      return NextResponse.json(
        { error: "許可されていないURLです" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "無効なURLです" },
      { status: 400 }
    );
  }

  try {
    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${result.token}`,
    };

    // Forward Range header for iOS Safari compatibility
    const rangeHeader = request.headers.get("Range");
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const res = await fetch(downloadUrl, {
      headers: fetchHeaders,
    });

    if (!res.ok && res.status !== 206) {
      return NextResponse.json(
        { error: `Audio fetch failed: ${res.status}` },
        { status: res.status }
      );
    }

    const contentType =
      res.headers.get("content-type") || "audio/mpeg";
    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    };

    // Forward content-length and content-range for Range requests
    const contentLength = res.headers.get("content-length");
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    const contentRange = res.headers.get("content-range");
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Audio proxy error:", error);
    return NextResponse.json(
      { error: "音声ファイルの取得に失敗しました" },
      { status: 500 }
    );
  }
}
