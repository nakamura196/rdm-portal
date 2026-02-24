import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  if (session.error) {
    return NextResponse.json(
      { error: "認証エラー。再ログインしてください。" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "10";

    const res = await fetch(
      `https://api.rdm.nii.ac.jp/v2/users/me/nodes/?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `APIエラー: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json(
      { error: "プロジェクト一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
