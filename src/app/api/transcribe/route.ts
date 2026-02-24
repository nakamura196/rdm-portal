import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI APIキーが設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { audioUrl, fileName } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: "audioUrl is required" },
        { status: 400 }
      );
    }

    // Fetch the audio file from GakuNin RDM
    const audioRes = await fetch(audioUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!audioRes.ok) {
      return NextResponse.json(
        { error: "音声ファイルの取得に失敗しました" },
        { status: 500 }
      );
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const audioBlob = new Blob([audioBuffer]);
    const file = new File(
      [audioBlob],
      fileName || "audio.mp3",
      { type: "audio/mpeg" }
    );

    // Send to Whisper API
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "ja",
    });

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "書き起こしに失敗しました" },
      { status: 500 }
    );
  }
}
