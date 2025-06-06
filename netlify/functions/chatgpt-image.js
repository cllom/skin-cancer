const fetch = require("node-fetch");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { prompt, image, mimeType } = JSON.parse(event.body || "{}");

    if (!prompt || !image || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing prompt, image, or MIME type" }),
      };
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    const text = await openaiResponse.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to parse OpenAI response",
          raw: text,
        }),
      };
    }

    return {
      statusCode: openaiResponse.ok ? 200 : openaiResponse.status,
      body: JSON.stringify(json),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
