import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const provider = (formData.get("provider") as string) || "osfstorage";

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "file and projectId are required" },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();

    const uploadUrl = `https://files.rdm.nii.ac.jp/v1/resources/${projectId}/providers/${provider}/?kind=file&name=${encodeURIComponent(file.name)}`;

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload error:", res.status, errorText);
      return NextResponse.json(
        { error: `アップロードに失敗しました: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "ファイルアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
