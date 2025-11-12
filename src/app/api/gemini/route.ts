import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs"; // ← これが重要！

const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    console.error("❌ API_KEY is undefined");
    return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
  }

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: "プロンプトがありません" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ result: text });
  } catch (e: unknown) {
    // 型が不明な例外を安全に扱う
    console.error("Gemini API error:", e);
    let message = String(e);
    if (e instanceof Error) message = e.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
