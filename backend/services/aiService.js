// backend/services/aiService.js
//
// Contains Gemini prompt-building and model-calling logic.

const { getAIModel } = require("../config/ai");

const SUMMARY_GENERATION_CONFIG = {
  temperature: 0.2,
  maxOutputTokens: 1024,
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const createFallbackSummary = (subject, body) => {
  const cleanSubject = typeof subject === "string" && subject.trim() ? subject.trim() : "Email";
  const cleanBody = typeof body === "string" && body.trim() ? body.trim() : "No body provided.";
  const preview = cleanBody.replace(/\s+/g, " ").slice(0, 160);
  return [`• ${cleanSubject} requires attention.`, `• The message indicates a follow-up or review is needed.`, `• The key details appear to be: ${preview}${preview.length >= 160 ? "..." : ""}`, `• Please review the full message and confirm the next step.`];
};

const createFallbackReply = ({ subject, body, senderName, tone = "professional" }) => {
  const cleanSubject = typeof subject === "string" && subject.trim() ? subject.trim() : "your message";
  const cleanSender = typeof senderName === "string" && senderName.trim() ? senderName.trim() : "the sender";
  const tonePrefix = tone === "friendly" ? "Hi" : tone === "concise" ? "Hello" : "Hello";
  return `${tonePrefix} ${cleanSender},\n\nThanks for your message about ${cleanSubject}. I’ve noted the details and will follow up shortly. Please let me know if there is anything urgent that needs immediate attention.`;
};

const createFallbackTasks = (body) => {
  const text = typeof body === "string" ? body : "";
  const tasks = [];
  const actionPattern = /(review|confirm|reply|send|submit|schedule|call|follow up|check|update|approve|attend|share)/i;
  const matches = text.match(/[^.!?]+[.!?]/g) || [];
  matches.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed && actionPattern.test(trimmed)) {
      tasks.push({
        title: trimmed.replace(/\s+/g, " ").slice(0, 90),
        assignee: "You",
        deadline: null,
        priority: "Medium",
        link: null,
      });
    }
  });
  if (tasks.length === 0) {
    tasks.push({
      title: "Review the email and confirm the next step",
      assignee: "You",
      deadline: null,
      priority: "Medium",
      link: null,
    });
  }
  return tasks.slice(0, 3);
};

/**
 * Strips a trailing bullet that was cut off mid-sentence (defensive
 * safety net — the prompt already forbids this, but if a response is
 * truncated for any reason we should never show the user a dangling
 * half-sentence).
 */
const dropTrailingIncompleteBullet = (text) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return text;
  }

  const last = lines[lines.length - 1];
  const endsCleanly = /[.!?"'”)]\s*$/.test(last);

  if (!endsCleanly) {
    return lines.slice(0, -1).join("\n");
  }

  return lines.join("\n");
};

/**
 * Builds a professional, anti-hallucination email-summary prompt.
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
You are an executive assistant summarizing an email for a busy professional.

SUBJECT:
${cleanSubject}

EMAIL CONTENT:
${cleanBody}

Read and understand the entire email before writing anything, then write a
summary in your OWN WORDS. Do not copy or lightly reword sentences straight
from the email — compress and restate the meaning as a skilled assistant
would when briefing their manager.

Produce 4 to 7 bullet points (use fewer only if the email is genuinely
trivial, e.g. a one-line automated notification). Cover, whichever apply:
- The purpose of the email.
- Important information the recipient needs to know.
- Any action required from the recipient.
- Deadlines or important dates.
- Meetings mentioned.
- Attachments mentioned.
- Important links mentioned.
- A final concluding note (what happens next, or who to contact).

STRICT FORMATTING RULES:
- Start every line with •
- Every single bullet MUST be a complete sentence with proper ending
  punctuation. Never stop mid-sentence, mid-clause, or mid-word.
- If you are running low on space, write FEWER complete bullets rather
  than a long bullet that gets cut off.
- Each bullet must add new, specific information — never restate the
  subject line or a previous bullet in different words.
- Preserve exact names, dates, deadlines, numbers and links from the email.
- Ignore greetings, sign-offs, signatures, legal footers, tracking pixels,
  and advertisements.
- Do not write a heading such as "Summary:".
- Do not write meta-commentary like "Analyze the Email", "Bullet 1", or
  repeat any of these instructions.
- Do not invent information that is not present in the email.
`;
};
const ALLOWED_REPLY_TONES = [
  "professional",
  "friendly",
  "concise",
];
const buildTaskPrompt = (body) => {
  return `
You are an AI assistant extracting actionable tasks from an email for a
task-management tool. Read the entire email first, then extract only
clear, real, actionable tasks — never invent one that isn't there.

For each task, return:
- title: a short, complete action statement (e.g. "Submit the internship report")
- assignee: the person responsible for the task if the email clearly states or implies it (e.g. "You", "Recruiter", a named person), otherwise null
- deadline: the exact date/day/time phrase mentioned in the email (e.g. "Friday", "July 30", "5 PM tomorrow"), otherwise null
- priority: High, Medium, or Low
- link: a single relevant URL from the email directly related to this task (e.g. a form, submission portal, or meeting link), otherwise null

Priority rules:
- High: urgent, immediate, today, tomorrow, or a strict/near deadline
- Medium: a real but non-urgent future deadline
- Low: optional, informational, or no deadline

Return ONLY valid JSON in this exact structure:

{
  "tasks": [
    {
      "title": "Submit internship report",
      "assignee": "You",
      "deadline": "Friday",
      "priority": "High",
      "link": "https://forms.google.com/xyz"
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
Do not invent an assignee, deadline, or link that isn't in the email.

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

  return `You are drafting a natural, human-sounding email reply on behalf of the recipient.

Original email subject:
${cleanSubject}

Sender:
${cleanSenderName}

Original email:
${cleanBody}

Instructions:
- ${toneInstructions[selectedTone]}
- Read the entire original email and respond directly to what it actually says and asks.
- Write in complete sentences. Never end the reply mid-sentence.
- Preserve important details (names, dates, numbers) exactly as given.
- Do not invent names, dates, times, promises, or facts not present in the original email or obviously implied by a direct reply.
- If the sender asks for confirmation, provide a suitable confirmation without inventing unavailable information.
- Do not include a subject line.
- Do not include headings such as "Generated Reply" or "Reply".
- Do not use markdown, bullet points, or code blocks.
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
  let model;
  try {
    model = getAIModel();
  } catch (error) {
    console.warn("Gemini unavailable at startup, using fallback summary.", error.message);
    return createFallbackSummary(subject, body).join("\n");
  }

  const prompt = buildSummaryPrompt(subject, body);
  const maximumAttempts = 3;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      console.log("======== GEMINI REQUEST ========", { attempt, promptLength: prompt.length });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          ...SUMMARY_GENERATION_CONFIG,
          // Give truncated responses more room on each retry rather than
          // repeating the same request and truncating again.
          maxOutputTokens: SUMMARY_GENERATION_CONFIG.maxOutputTokens + (attempt - 1) * 400,
        },
      });
      const response = await result.response;
      const rawText = response.text()?.trim();
      console.log("======== GEMINI RESPONSE ========", { attempt, rawText });

      const finishReason = response?.candidates?.[0]?.finishReason;

      console.log("Gemini finish reason:", finishReason);
      console.log("Generated summary:", rawText);

      if (!rawText || rawText.length < 20) {
        const error = new Error(
          "Gemini returned an incomplete summary. Please try again."
        );

        error.status = 502;
        throw error;
      }

      if (finishReason === "MAX_TOKENS") {
        // The model ran out of room mid-thought. Retrying with a bigger
        // budget (see above) gives a real shot at a complete summary
        // instead of silently handing back a truncated one.
        const truncationError = new Error(
          "Gemini truncated the summary before finishing."
        );
        truncationError.status = 503;
        throw truncationError;
      }

      const text = dropTrailingIncompleteBullet(rawText);

      return text.trim();
    } catch (error) {
      const temporaryError = isTemporaryGeminiError(error);

      if (!temporaryError) {
        console.warn("Gemini summarize unavailable, using fallback summary.", error.message);
        return createFallbackSummary(subject, body).join("\n");
      }

      if (attempt === maximumAttempts) {
        // Even after retries we may only have a truncated draft. Prefer
        // returning a safe fallback summary instead of failing the entire
        // user action when Gemini is temporarily unavailable.
        console.warn(
          "Gemini summary retries exhausted, using fallback summary.",
          error.message
        );
        return createFallbackSummary(subject, body).join("\n");
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

  let model;
  try {
    model = getAIModel();
  } catch (error) {
    console.warn("Gemini unavailable at startup, using fallback reply.", error.message);
    return createFallbackReply({ subject, body, senderName, tone: normalizedTone });
  }

  const prompt = buildReplyPrompt({
    subject,
    body,
    senderName,
    tone: normalizedTone,
  });

  const maximumAttempts = 2;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      console.log("======== GEMINI REQUEST ========", { attempt, promptLength: prompt.length });
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
      console.log("======== GEMINI RESPONSE ========", { attempt, reply });

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
        console.warn("Gemini reply generation unavailable, using fallback reply.", error.message);
        return createFallbackReply({ subject, body, senderName, tone: normalizedTone });
      }

      if (attempt === maximumAttempts) {
        console.warn(
          "Gemini reply retries exhausted, using fallback reply.",
          error.message
        );
        return createFallbackReply({ subject, body, senderName, tone: normalizedTone });
      }

      console.warn(
        "Gemini reply generation is temporarily unavailable. Retrying..."
      );

      await wait(1000);
      continue;
    }
  }

  const error = new Error("Failed to generate email reply");
  error.status = 502;
  throw error;
};
const extractEmailTasks = async (body) => {
  if (!body || !body.trim()) {
    const error = new Error("Email body is required");
    error.statusCode = 400;
    throw error;
  }

  let model;
  try {
    model = getAIModel();
  } catch (error) {
    console.warn("Gemini unavailable at startup, using fallback tasks.", error.message);
    return createFallbackTasks(body);
  }
  const maximumAttempts = 3;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      console.log("======== GEMINI REQUEST ========", { attempt, bodyLength: body.length });
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

      const response = await result.response;
      const rawText = response.text();
      console.log("======== GEMINI RESPONSE ========", { attempt, rawText });

      console.log(
        "Gemini task extraction finish reason:",
        response.candidates?.[0]?.finishReason
      );

      if (!rawText || !rawText.trim()) {
        const emptyError = new Error(
          "AI returned an empty task extraction response"
        );
        emptyError.status = 502;
        throw emptyError;
      }

      const cleanedText = cleanJsonResponse(rawText);

      let parsedResult;

      try {
        parsedResult = JSON.parse(cleanedText);
      } catch (parseException) {
        console.error("Invalid task JSON returned by Gemini:", rawText);

        const parseError = new Error(
          "AI returned an invalid task extraction response"
        );
        parseError.status = 502;
        throw parseError;
      }

      if (!Array.isArray(parsedResult.tasks)) {
        const formatError = new Error(
          "AI response does not contain a tasks array"
        );
        formatError.status = 502;
        throw formatError;
      }

      const tasks = parsedResult.tasks
        .filter((task) => task && typeof task.title === "string" && task.title.trim())
        .map((task) => ({
          title: task.title.trim(),
          assignee:
            typeof task.assignee === "string" && task.assignee.trim()
              ? task.assignee.trim()
              : null,
          deadline:
            typeof task.deadline === "string" && task.deadline.trim()
              ? task.deadline.trim()
              : null,
          priority: normalizePriority(task.priority),
          link:
            typeof task.link === "string" && /^https?:\/\//i.test(task.link.trim())
              ? task.link.trim()
              : null,
        }));

      return tasks;
    } catch (error) {
      const temporaryError = isTemporaryGeminiError(error);

      if (!temporaryError) {
        console.warn("Gemini task extraction unavailable, using fallback tasks.", error.message);
        return createFallbackTasks(body);
      }

      if (attempt === maximumAttempts) {
        console.warn(
          "Gemini task extraction retries exhausted, using fallback tasks.",
          error.message
        );
        return createFallbackTasks(body);
      }

      const delay = 1000 * attempt;
      console.warn(
        `Gemini task extraction is temporarily unavailable. Retrying in ${delay / 1000} seconds...`
      );
      await wait(delay);
    }
  }

  console.warn("Gemini task extraction failed, returning fallback tasks.");
  return createFallbackTasks(body);
};

module.exports = {
  summarizeEmail,
  generateEmailReply,
  extractEmailTasks,
  buildSummaryPrompt,
  buildReplyPrompt,
  buildTaskPrompt,
};