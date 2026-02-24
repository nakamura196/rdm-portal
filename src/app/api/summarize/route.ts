import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/authOptions";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Anthropic APIキーが設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { text, title } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `以下は「${title || "音声データ"}」の書き起こしテキストです。この内容をflier（本の要約サービス）のようなスタイルで要約してください。

要約には以下を含めてください：
1. **概要**（3-5行）：この音声の主なテーマと結論
2. **重要ポイント**（3-5個）：箇条書きで重要な内容
3. **キーワード**（5個程度）：この内容に関連するキーワード
4. **英語学習メモ**：内容に関連する重要な英語表現や専門用語があれば記載

書き起こしテキスト：
${text}`,
        },
      ],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "要約生成に失敗しました" },
      { status: 500 }
    );
  }
}
