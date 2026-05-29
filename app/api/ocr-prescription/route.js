import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json(
        { error: "No prescription image file provided." },
        { status: 400 }
      );
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Maximum size is 4MB." }, { status: 413 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("Missing GROQ_API_KEY in server environment");
      return NextResponse.json(
        { error: "AI OCR service is not configured (missing Groq API key)." },
        { status: 500 }
      );
    }

    // Convert file to Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Call Groq Vision API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
              {
                type: "text",
                text: "Extract all medicines from this prescription. Return ONLY a JSON array, no markdown. Each item must have: name, dosage, frequency, duration. If unclear write 'unclear'.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Vision API error response:", response.status, errorText);
      return NextResponse.json(
        { error: "Error communicating with Groq Vision service." },
        { status: response.status }
      );
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "[]";
    
    // Strip markdown JSON fences if present
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    let medicines = [];
    try {
      medicines = JSON.parse(text);
    } catch (parseErr) {
      console.error("Failed to parse AI OCR response as JSON. Raw response was:", text);
      return NextResponse.json(
        { error: "AI generated an invalid JSON format. Try scanning again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ medicines });
  } catch (error) {
    console.error("Error in ocr-prescription API route:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during OCR scanning." },
      { status: 500 }
    );
  }
}
