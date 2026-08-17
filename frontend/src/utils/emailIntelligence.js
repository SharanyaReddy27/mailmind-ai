// Client-side email intelligence helpers.
//
// These are deliberately NOT Gemini calls: detecting a Zoom link, a PDF
// filename, or the word "urgent" doesn't need an LLM, and keeping this
// logic client-side means zero new API surface and zero new backend load.
// Everything here is a heuristic over text that's already in the email
// object the app already fetched - nothing here is fabricated or invented.

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

const PROVIDER_RULES = [
  { test: (u) => /zoom\.us/i.test(u), provider: "Zoom", label: "Join Meeting", kind: "meeting" },
  { test: (u) => /meet\.google\.com/i.test(u), provider: "Google Meet", label: "Join Meeting", kind: "meeting" },
  { test: (u) => /teams\.(microsoft|live)\.com/i.test(u), provider: "Microsoft Teams", label: "Join Meeting", kind: "meeting" },
  { test: (u) => /forms\.google\.com|forms\.gle|docs\.google\.com\/forms/i.test(u), provider: "Google Form", label: "Complete Form", kind: "form" },
  { test: (u) => /docs\.google\.com|sheets\.google\.com|slides\.google\.com/i.test(u), provider: "Google Docs", label: "View Document", kind: "doc" },
  { test: (u) => /drive\.google\.com/i.test(u), provider: "Google Drive", label: "Open Drive Folder", kind: "drive" },
  { test: (u) => /github\.com/i.test(u), provider: "GitHub", label: "Open GitHub", kind: "github" },
  { test: (u) => /notion\.(so|site)/i.test(u), provider: "Notion", label: "Open Notion", kind: "notion" },
  { test: (u) => /figma\.com/i.test(u), provider: "Figma", label: "Open Figma", kind: "figma" },
  { test: (u) => /atlassian\.net|jira/i.test(u), provider: "Jira", label: "Open Jira", kind: "jira" },
  { test: (u) => /trello\.com/i.test(u), provider: "Trello", label: "Open Trello", kind: "trello" },
  { test: (u) => /leetcode\.com/i.test(u), provider: "LeetCode", label: "Open LeetCode", kind: "code" },
  { test: (u) => /codeforces\.com/i.test(u), provider: "Codeforces", label: "Open Codeforces", kind: "code" },
];

function stripTrailingPunctuation(url) {
  return url.replace(/[.,;:!?)"'\]]+$/, "");
}

/**
 * Finds URLs in the given text and categorizes them into known providers
 * (meeting apps, forms, docs, code hosts, etc.) so they can be rendered as
 * labeled action buttons instead of raw hyperlinks. Unrecognized URLs still
 * come back with a generic "Open Link" label - nothing is dropped.
 */
export function detectLinks(text) {
  if (!text) return [];

  const matches = text.match(URL_REGEX) || [];
  const seen = new Set();
  const links = [];

  for (const raw of matches) {
    const url = stripTrailingPunctuation(raw);
    if (seen.has(url)) continue;
    seen.add(url);

    const rule = PROVIDER_RULES.find((r) => r.test(url));
    let hostname = "";
    try {
      hostname = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      hostname = url;
    }

    links.push({
      url,
      provider: rule?.provider || hostname,
      label: rule?.label || "Open Link",
      kind: rule?.kind || "generic",
    });
  }

  return links;
}

const ATTACHMENT_EXTENSIONS = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  ppt: "ppt",
  pptx: "ppt",
  xls: "sheet",
  xlsx: "sheet",
  zip: "archive",
  rar: "archive",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  mp4: "video",
  mov: "video",
};

const FILENAME_REGEX = new RegExp(
  `\\b[\\w][\\w-]{0,60}\\.(${Object.keys(ATTACHMENT_EXTENSIONS).join("|")})\\b`,
  "gi"
);

/**
 * Finds filename-like mentions (e.g. "Assignment.pdf") in the email text.
 * If a URL appears on the same line as the filename, it's attached as a
 * download/preview link; otherwise the attachment is shown as "mentioned
 * only" rather than inventing a link that doesn't exist.
 */
export function detectAttachments(text) {
  if (!text) return [];

  const lines = text.split("\n");
  const found = [];
  const seenNames = new Set();

  for (const line of lines) {
    const filenameMatches = line.match(FILENAME_REGEX) || [];
    if (filenameMatches.length === 0) continue;

    const urlsOnLine = line.match(URL_REGEX) || [];
    const lineUrl = urlsOnLine.length > 0 ? stripTrailingPunctuation(urlsOnLine[0]) : null;

    for (const rawName of filenameMatches) {
      const name = rawName.trim();
      const key = name.toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);

      const ext = name.split(".").pop().toLowerCase();
      const kind = ATTACHMENT_EXTENSIONS[ext] || "file";

      found.push({
        name,
        extension: ext,
        kind,
        url: lineUrl,
      });
    }
  }

  return found;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_ABBREVIATIONS = MONTHS.map((m) => m.slice(0, 3));

function nextWeekday(reference, targetDay, forceNextWeek) {
  const result = new Date(reference);
  const currentDay = result.getDay();
  let diff = (targetDay - currentDay + 7) % 7;
  if (diff === 0 || forceNextWeek) diff += 7;
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Scans text for common relative/explicit deadline phrases ("tomorrow",
 * "Friday", "next week", "July 30", "before 5 PM") and resolves them to an
 * actual date relative to the email's received date, where possible.
 */
export function detectDeadlines(text, referenceDate) {
  if (!text) return [];

  const reference = referenceDate ? new Date(referenceDate) : new Date();
  const results = [];
  const seen = new Set();

  const addResult = (raw, date, label) => {
    const key = `${raw.toLowerCase()}-${label}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ raw, date: date ? date.toISOString() : null, label });
  };

  if (/\btoday\b/i.test(text)) {
    addResult("today", reference, reference.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }

  if (/\btomorrow\b/i.test(text)) {
    const date = new Date(reference);
    date.setDate(date.getDate() + 1);
    addResult("tomorrow", date, date.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }

  if (/\bnext week\b/i.test(text)) {
    const date = new Date(reference);
    date.setDate(date.getDate() + 7);
    addResult("next week", date, date.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }

  const weekdayRegex = /\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi;
  let weekdayMatch;
  while ((weekdayMatch = weekdayRegex.exec(text)) !== null) {
    const forceNextWeek = Boolean(weekdayMatch[1]);
    const dayName = weekdayMatch[2].toLowerCase();
    const date = nextWeekday(reference, WEEKDAYS.indexOf(dayName), forceNextWeek);
    addResult(
      weekdayMatch[0],
      date,
      date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    );
  }

  const monthDayRegex = new RegExp(
    `\\b(${MONTHS.join("|")}|${MONTH_ABBREVIATIONS.join("|")})\\.?\\s+(\\d{1,2})(st|nd|rd|th)?\\b`,
    "gi"
  );
  let monthMatch;
  while ((monthMatch = monthDayRegex.exec(text)) !== null) {
    const monthToken = monthMatch[1].toLowerCase();
    const monthIndex = MONTHS.indexOf(monthToken) !== -1
      ? MONTHS.indexOf(monthToken)
      : MONTH_ABBREVIATIONS.indexOf(monthToken);
    if (monthIndex === -1) continue;

    const day = parseInt(monthMatch[2], 10);
    let year = reference.getFullYear();
    let date = new Date(year, monthIndex, day);

    // If that date already passed relative to the reference by more than a
    // few days, assume it means next year rather than the past.
    if (date.getTime() < reference.getTime() - 5 * 24 * 60 * 60 * 1000) {
      date = new Date(year + 1, monthIndex, day);
    }

    addResult(
      monthMatch[0],
      date,
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    );
  }

  const timeRegex = /\b(?:before|by|at)\s+(\d{1,2}(?::\d{2})?\s?(?:am|pm))\b/gi;
  let timeMatch;
  while ((timeMatch = timeRegex.exec(text)) !== null) {
    addResult(timeMatch[0], null, timeMatch[1].toUpperCase());
  }

  return results;
}

const URGENCY_KEYWORDS = [
  "urgent", "asap", "immediately", "as soon as possible", "action required",
  "final reminder", "last chance", "time-sensitive", "time sensitive",
  "important:", "please respond immediately",
];

const REPLY_KEYWORDS = [
  "please reply", "let me know", "get back to me", "rsvp", "confirm",
  "kindly respond", "your response", "please respond", "please confirm",
  "awaiting your reply",
];

const MEETING_KEYWORDS = ["meeting", "call at", "zoom", "google meet", "microsoft teams", "schedule a call"];
const PAYMENT_KEYWORDS = ["payment", "invoice", "amount due", "pay now", "transaction", "fee of", "$", "₹"];
const CONTACT_REGEX = /\+?\d[\d\-\s()]{7,}\d|\bcontact (us|me)\b|\breach out\b/i;

/**
 * Computes a small set of at-a-glance insights about the email, purely
 * from heuristics over its own text - no AI call, no fabricated numbers.
 */
export function computeInsights(email, { links = [], attachments = [], deadlines = [] } = {}) {
  const subject = email?.subject || "";
  const body = email?.body || email?.content || email?.message || "";
  const combined = `${subject}\n${body}`.toLowerCase();

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  const urgencyHits = URGENCY_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  const isHighPriority = email?.priority === "High";
  let urgency = "Low";
  if (urgencyHits > 0 || isHighPriority) urgency = "High";
  else if (deadlines.length > 0) urgency = "Medium";

  const requiresReply =
    REPLY_KEYWORDS.some((kw) => combined.includes(kw)) || /\?\s*$/.test(body.trim());

  const containsMeeting =
    MEETING_KEYWORDS.some((kw) => combined.includes(kw)) ||
    links.some((l) => l.kind === "meeting");

  const containsForm =
    /\bsurvey\b|\bquestionnaire\b|\bform\b/.test(combined) ||
    links.some((l) => l.kind === "form");

  const containsPayment = PAYMENT_KEYWORDS.some((kw) => combined.includes(kw));

  const containsAttachment =
    attachments.length > 0 || /\battached\b|\battachment\b/.test(combined);

  const containsExternalLink = links.length > 0;

  const containsContactInfo = CONTACT_REGEX.test(body);

  return {
    readingTimeMinutes,
    urgency,
    requiresReply,
    containsDeadline: deadlines.length > 0,
    containsAttachment,
    containsMeeting,
    containsPayment,
    containsForm,
    containsExternalLink,
    containsContactInfo,
  };
}
