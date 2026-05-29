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

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!geminiApiKey && !groqApiKey) {
      console.error("Missing both GEMINI_API_KEY and GROQ_API_KEY in server environment");
      return NextResponse.json(
        { error: "AI OCR service is not configured (missing Gemini or Groq API keys)." },
        { status: 500 }
      );
    }

    // Convert file to Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    let medicines = [];

    if (geminiApiKey) {
      console.log("Using Google Gemini API for Vision OCR...");
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Extract all medicines from this prescription. Return a JSON array where each item has exact keys: name, dosage, frequency, duration. If a field is unclear, write 'unclear'."
                    },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("Gemini API error response:", geminiResponse.status, errorText);
          if (groqApiKey) {
            console.log("Gemini failed. Falling back to Groq Vision...");
            medicines = await callGroqVision(groqApiKey, mimeType, base64);
          } else {
            return NextResponse.json(
              { error: "Error communicating with Google Gemini service." },
              { status: geminiResponse.status }
            );
          }
        } else {
          const data = await geminiResponse.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
          try {
            medicines = JSON.parse(text);
          } catch (parseErr) {
            console.error("Failed to parse Gemini response as JSON. Raw response was:", text);
            if (groqApiKey) {
              console.log("Gemini JSON parse failed. Falling back to Groq Vision...");
              medicines = await callGroqVision(groqApiKey, mimeType, base64);
            } else {
              return NextResponse.json(
                { error: "AI generated an invalid JSON format. Try scanning again." },
                { status: 500 }
              );
            }
          }
        }
      } catch (geminiErr) {
        console.error("Exception during Gemini Vision call:", geminiErr);
        if (groqApiKey) {
          console.log("Gemini exception. Falling back to Groq Vision...");
          medicines = await callGroqVision(groqApiKey, mimeType, base64);
        } else {
          return NextResponse.json(
            { error: geminiErr.message || "Failed to communicate with Google Gemini service." },
            { status: 500 }
          );
        }
      }
    } else {
      console.log("Using Groq API for Vision OCR...");
      medicines = await callGroqVision(groqApiKey, mimeType, base64);
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

async function callGroqVision(apiKey, mimeType, base64) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
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
    throw new Error("Error communicating with Groq Vision service.");
  }

  const data = await response.json();
  let text = data.choices[0]?.message?.content || "[]";
  
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(text);
}
