import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { BatchUploadResult, BatchUploadResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const provider = (formData.get("provider") as string) || "osfstorage";
    const files = formData.getAll("files") as File[];

    if (!files.length || !projectId) {
      return NextResponse.json(
        { error: "files and projectId are required" },
        { status: 400 }
      );
    }

    const results: BatchUploadResult[] = [];

    for (const file of files) {
      try {
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
          console.error(`Upload error for ${file.name}:`, res.status, errorText);
          results.push({
            fileName: file.name,
            status: "error",
            error: `HTTP ${res.status}`,
            size: file.size,
          });
        } else {
          results.push({
            fileName: file.name,
            status: "success",
            size: file.size,
          });
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        results.push({
          fileName: file.name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          size: file.size,
        });
      }

      // 1-second delay between uploads to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const response: BatchUploadResponse = {
      totalFiles: files.length,
      completed: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Batch upload error:", error);
    return NextResponse.json(
      { error: "バッチアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
