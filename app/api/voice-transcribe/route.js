import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided — field 'audio' is missing" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("Missing GROQ_API_KEY in server environment");
      return NextResponse.json(
        { error: "Medical Transcription service is not configured (missing Groq API key)." },
        { status: 500 }
      );
    }

    // Prepare FormData specifically for Groq's transcription endpoint
    const ext = file.type?.includes("mp4") ? "mp4" : "webm";
    const audioFile = new File([await file.arrayBuffer()], `recording.${ext}`, { type: file.type || "audio/webm" });

    const groqFormData = new FormData();
    groqFormData.append("file", audioFile);
    groqFormData.append("model", "whisper-large-v3");

    // Make the external request to Groq API
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Whisper API returned an error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to transcribe audio via Groq Whisper API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({ text: data.text || "" });
  } catch (error) {
    console.error("Error in voice-transcribe API route:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during transcription." },
      { status: 500 }
    );
  }
}
