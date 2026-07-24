// backend/services/aiService.js
//
// Contains Gemini prompt-building and model-calling logic.

const { getAIModel } = require("../config/ai");

const SUMMARY_GENERATION_CONFIG = {
  temperature: 0.1,
  maxOutputTokens: 700,
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Builds a detailed but concise email-summary prompt.
 */
const buildSummaryPrompt = (subject, body) => {
  const cleanSubject =
    typeof subject === "string" && subject.trim()
      ? subject.trim()
      : "No subject";

  const cleanBody =
    typeof body === "string" && body.trim()
      ? body.trim()
      : "No email content provided";

  return `
Summarize the following email for the recipient.

SUBJECT:
${cleanSubject}

EMAIL CONTENT:
${cleanBody}

Return only 2 to 5 useful bullet points.

Rules:
- Start each point with •
- State the actual purpose of the email.
- Include every important action the recipient must complete.
- Include relevant names, dates, deadlines and links.
- Ignore greetings, signatures, tracking links and legal footer text.
- Do not write a heading.
- Do not write "Analyze the Email".
- Do not write "Bullet 1", "Purpose" or repeat these instructions.
- Do not invent information.
`;
};
const ALLOWED_REPLY_TONES = [
  "professional",
  "friendly",
  "concise",
];
const buildTaskPrompt = (body) => {
  return `
You are an AI email task extraction assistant.

Read the email below and extract only clear, actionable tasks.

For each task, return:
- title: a short action statement
- deadline: the date or time mentioned in the email, or null
- priority: High, Medium, or Low

Priority rules:
- High: urgent, immediate, today, tomorrow, important, or strict deadline
- Medium: task has a future deadline but is not urgent
- Low: optional or no deadline

Return ONLY valid JSON in this exact structure:

{
  "tasks": [
    {
      "title": "Submit internship report",
      "deadline": "Friday",
      "priority": "High"
    }
  ]
}

If there are no actionable tasks, return:

{
  "tasks": []
}

Do not add markdown.
Do not use code fences.
Do not add explanations.

Email:
${body}
`;
};
const cleanJsonResponse = (text) => {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
};
const buildReplyPrompt = ({
  subject,
  body,
  senderName,
  tone,
}) => {
  const cleanSubject =
    typeof subject === "string" && subject.trim()
      ? subject.trim()
      : "No subject";

  const cleanBody =
    typeof body === "string" ? body.trim() : "";

  const cleanSenderName =
    typeof senderName === "string" && senderName.trim()
      ? senderName.trim()
      : "Sender";

  const selectedTone = ALLOWED_REPLY_TONES.includes(tone)
    ? tone
    : "professional";

  const toneInstructions = {
    professional:
      "Use a professional, courteous and business-appropriate tone.",
    friendly:
      "Use a warm, friendly and approachable tone while remaining respectful.",
    concise:
      "Keep the reply brief, direct and complete.",
  };

  return `Draft a natural email reply to the email below.

Original email subject:
${cleanSubject}

Sender:
${cleanSenderName}

Original email:
${cleanBody}

Instructions:
- ${toneInstructions[selectedTone]}
- Respond directly to the actual email.
- Preserve important details accurately.
- Do not invent names, dates, times, promises or facts.
- If the sender asks for confirmation, provide a suitable confirmation without inventing unavailable information.
- Do not include a subject line.
- Do not include headings such as "Generated Reply" or "Reply".
- Do not use markdown, bullet points or code blocks.
- Do not add the recipient's name unless it is provided.
- Return only the email reply body.`;
};
/**
 * Checks whether Gemini returned a temporary server error.
 */
const isTemporaryGeminiError = (error) => {
  const status =
    error?.status ||
    error?.response?.status ||
    error?.statusCode;

  if ([429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("503") ||
    message.includes("500") ||
    message.includes("overloaded") ||
    message.includes("unavailable")
  );
};

/**
 * Sends the email to Gemini and returns the generated summary.
 * Retries temporary 503/high-demand errors automatically.
 */
const summarizeEmail = async (subject, body) => {
  const model = getAIModel();
  const prompt = buildSummaryPrompt(subject, body);

  const maximumAttempts = 3;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: SUMMARY_GENERATION_CONFIG,
      });
      const response = await result.response;
      const text = response.text()?.trim();

      const finishReason = response?.candidates?.[0]?.finishReason;

      console.log("Gemini finish reason:", finishReason);
      console.log("Generated summary:", text);

      if (!text || text.length < 20) {
        const error = new Error(
        "Gemini returned an incomplete summary. Please try again."
      );

      error.status = 502;
      throw error;
    }

      return text.trim();
    } catch (error) {
      const temporaryError = isTemporaryGeminiError(error);

      if (!temporaryError) {
        throw error;
      }

      if (attempt === maximumAttempts) {
        const busyError = new Error(
          "Gemini is currently busy. Please wait a moment and try again."
        );

        busyError.status = 503;
        throw busyError;
      }

      const delay = 2000 * attempt;

   console.warn(
  `Gemini is temporarily unavailable. Retrying in ${delay / 1000} seconds...`
);

await wait(delay);
continue;
    }
  }

  const error = new Error(
    "Gemini is currently busy. Please try again shortly."
  );

  error.status = 503;
  throw error;
};
const normalizePriority = (priority) => {
  if (typeof priority !== "string") {
    return "Medium";
  }

  const normalized = priority.trim().toLowerCase();

  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";

  return "Medium";
};
const createAIServiceError = (error) => {
  const status = error?.status || error?.response?.status;

  if (status === 429) {
    const quotaError = new Error(
      "AI request limit reached. Please try again after some time."
    );
    quotaError.statusCode = 429;
    return quotaError;
  }

  if ([500, 502, 503, 504].includes(status)) {
    const temporaryError = new Error(
      "AI service is temporarily unavailable. Please try again."
    );
    temporaryError.statusCode = 503;
    return temporaryError;
  }

  const genericError = new Error("AI service request failed");
  genericError.statusCode = 500;
  return genericError;
};
const generateEmailReply = async ({
  subject,
  body,
  senderName,
  tone = "professional",
}) => {
  if (typeof body !== "string" || !body.trim()) {
    const error = new Error("Email body is required");
    error.status = 400;
    throw error;
  }

  const normalizedTone =
    typeof tone === "string"
      ? tone.trim().toLowerCase()
      : "professional";

  if (!ALLOWED_REPLY_TONES.includes(normalizedTone)) {
    const error = new Error(
      "Tone must be professional, friendly or concise"
    );
    error.status = 400;
    throw error;
  }

  const model = getAIModel();

  const prompt = buildReplyPrompt({
    subject,
    body,
    senderName,
    tone: normalizedTone,
  });

  const maximumAttempts = 2;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      });

      const response = await result.response;
      let reply = response.text()?.trim();

      if (!reply) {
        const error = new Error(
          "AI returned an empty reply. Please try again."
        );

        error.status = 502;
        throw error;
      }

      reply = reply
        .replace(/^(generated reply|email reply|reply)\s*:\s*/i, "")
        .replace(/^```(?:text)?/i, "")
        .replace(/```$/i, "")
        .trim();

      if (reply.length < 10) {
        const error = new Error(
          "AI returned an incomplete reply. Please try again."
        );

        error.status = 502;
        throw error;
      }

      return reply;
    } catch (error) {
      const temporaryError = isTemporaryGeminiError(error);

      if (!temporaryError) {
        throw error;
      }

      if (attempt === maximumAttempts) {
        const busyError = new Error(
          "AI service is currently busy. Please try again shortly."
        );

        busyError.status = 503;
        throw busyError;
      }

    console.warn(
  "Gemini reply generation is temporarily unavailable. Retrying..."
);

await wait(1000);
continue;
  }
  }
  const error = new Error(
    "Failed to generate email reply"
  );

  error.status = 502;
  throw error;
};
const extractEmailTasks = async (body) => {
  if (!body || !body.trim()) {
    const error = new Error("Email body is required");
    error.statusCode = 400;
    throw error;
  }

  const model = getAIModel();

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildTaskPrompt(body),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const rawText = response.text();

  console.log(
    "Gemini task extraction finish reason:",
    response.candidates?.[0]?.finishReason
  );

  const cleanedText = cleanJsonResponse(rawText);

  let parsedResult;

  try {
    parsedResult = JSON.parse(cleanedText);
  } catch (error) {
    console.error("Invalid task JSON returned by Gemini:", rawText);

    const parseError = new Error(
      "AI returned an invalid task extraction response"
    );
    parseError.statusCode = 502;
    throw parseError;
  }

  if (!Array.isArray(parsedResult.tasks)) {
    const formatError = new Error("AI response does not contain a tasks array");
    formatError.statusCode = 502;
    throw formatError;
  }

  const tasks = parsedResult.tasks
    .filter((task) => task && typeof task.title === "string")
    .map((task) => ({
      title: task.title.trim(),
      deadline:
        typeof task.deadline === "string" && task.deadline.trim()
          ? task.deadline.trim()
          : null,
      priority: normalizePriority(task.priority),
    }));
   
  return tasks;
};

module.exports = {
  summarizeEmail,
  generateEmailReply,
  extractEmailTasks,
  buildSummaryPrompt,
  buildReplyPrompt,
  buildTaskPrompt,
};