import { NextRequest, NextResponse } from "next/server";
import { resolveToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const projectId = path[0];
  const remainingPath = path.slice(1).join("/");

  const result = await resolveToken(projectId);
  if (!result) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    let url: string;
    if (remainingPath) {
      url = `https://api.rdm.nii.ac.jp/v2/nodes/${projectId}/files/osfstorage/${remainingPath}`;
    } else {
      url = `https://api.rdm.nii.ac.jp/v2/nodes/${projectId}/files/osfstorage/`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${result.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `APIエラー: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Files fetch error:", error);
    return NextResponse.json(
      { error: "ファイル一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
