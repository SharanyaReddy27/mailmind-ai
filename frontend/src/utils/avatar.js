// Deterministic avatar helpers so the same sender always renders the same
// initials and accent color, with no network calls or backend changes.

const PALETTE = [
  { bg: "rgba(110, 119, 245, 0.18)", fg: "#a9affa" }, // violet
  { bg: "rgba(47, 217, 180, 0.18)", fg: "#7fe9d2" }, // teal
  { bg: "rgba(255, 164, 92, 0.18)", fg: "#ffc394" }, // amber
  { bg: "rgba(255, 107, 110, 0.18)", fg: "#ffa3a5" }, // coral
  { bg: "rgba(148, 163, 255, 0.18)", fg: "#c2c9ff" }, // periwinkle
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getInitials(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getAvatarColors(seed = "") {
  const index = hashString(seed || "mailmind") % PALETTE.length;
  return PALETTE[index];
}
