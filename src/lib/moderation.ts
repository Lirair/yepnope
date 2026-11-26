export type ModerationReason = "hate_violence" | "link" | "personal_data";

export interface ModerationResult {
  ok: boolean;
  reason?: ModerationReason;
}

export interface DeckModerationResult extends ModerationResult {
  offendingItem?: string;
}

/**
 * Normalizes text against accents, leetspeak substitutions, and repeated characters
 * while preserving word boundaries so legitimate movie/food/game titles aren't falsely flagged.
 */
function normalizeForModeration(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[@4]/g, "a")
    .replace(/[3€]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1") // collapse elongated letters (e.g. "muoooriiii" -> "muoorii")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compact version with spaces removed for catching spaced-out evasion (e.g. "n e g r o").
 * Applied ONLY to unambiguous severe slurs/self-harm terms.
 */
function compactForEvasion(normalized: string): string {
  return normalized.replace(/\s+/g, "");
}

// Strict word-boundary patterns for hate speech, slurs, severe violence, self-harm, and explicit abuse (IT + EN)
const SEVERE_WORD_PATTERNS: RegExp[] = [
  // Racial / ethnic / homophobic / ableist slurs (IT & EN)
  /\b(negr[oaie]|nigg[ae]r?s?|froc[io][a-z]*|ricchion[ei]|finocch[io][a-z]*|fagg?ots?|retards?|ritardat[oaie]|handicappat[oaie]|mongoloid[ei]|zingar[oaie]\s+di\s+merda|ebre[oaie]\s+di\s+merda|kike|spic|chink)\b/i,
  // Explicit self-harm / suicide encouragement
  /\b(suicidat[ei]|ammazzat[ei]|uccidit[ei]|impiccat[ei]|buttati\s+di\s+sotto|tagliati\s+le\s+vene|kill\s+yourself|kys|hang\s+yourself|go\s+die)\b/i,
  // Explicit hate ideologies / terrorism / sexual violence / CSA
  /\b(heil\s+hitler|sieg\s+heil|viva\s+hitler|forni\s+crematori|bruciare\s+i\s+|stupr[aoie][a-z]*|rape|rapist|pedofil[oaie]|pedoporn[a-z]*|child\s+porn|cp\s+link|terroris[tm][a-z]*\s+attack)\b/i,
  // Explicit incitement to murder / severe physical violence against people
  /\b(ti\s+ammazzo|vi\s+ammazzo|ti\s+uccido|vi\s+uccido|deve\s+morire|dovete\s+morire|sparagli|accoltell[a-z]+|picchiam[oa]|pestiam[oa]|bruciam[oa]\s+viv[oaie])\b/i,
  // Explicit cyberbullying / targeting list templates
  /\b(chi\s+odiamo|chi\s+fa\s+piu\s+schifo|piu\s+brutt[oa]\s+della\s+classe|piu\s+sfigat[oa]\s+della\s+classe|chi\s+cacciamo\s+dal\s+gruppo|chi\s+sta\s+sul\s+cazzo|chi\s+merita\s+di)\b/i,
];

// Unambiguous high-severity tokens checked even if space-evaded (only when original has spaced single letters)
const SPACED_EVASION_TOKENS = [
  "nigger",
  "faggot",
  "frocio",
  "ricchione",
  "suicidati",
  "ammazzati",
  "ucciditi",
  "heilhitler",
  "pedofilo",
  "stupro",
];

// URLs / phishing links
const URL_PATTERN =
  /(?:https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(?:com|it|net|org|io|co|me|ly|gg|xyz|ru|cn|app|link|click|site|online|shop|info|tv)\b(?:\/|\?|$|\s))/i;

// Email addresses (anti-doxxing)
const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;

// Phone numbers: 8+ digits possibly separated by spaces, dots, hyphens, slashes or parentheses
const PHONE_PATTERN = /(?:\+?\d[\d\s.\-/()]{7,}\d)/;

function looksLikePhoneNumber(text: string): boolean {
  const match = text.match(PHONE_PATTERN);
  if (!match) return false;
  const digitsOnly = match[0].replace(/\D/g, "");
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

export function checkTextSafety(rawText: string): ModerationResult {
  const text = rawText.trim();
  if (!text) return { ok: true };

  // 1. Block personal data (email / phone numbers -> anti-doxxing)
  if (EMAIL_PATTERN.test(text) || looksLikePhoneNumber(text)) {
    return { ok: false, reason: "personal_data" };
  }

  // 2. Block URLs / links (anti-phishing & spam)
  if (URL_PATTERN.test(text)) {
    return { ok: false, reason: "link" };
  }

  // 3. Block severe hate speech, slurs, violence, self-harm, and bullying prompts
  const normalized = normalizeForModeration(text);
  for (const pattern of SEVERE_WORD_PATTERNS) {
    if (pattern.test(normalized)) {
      return { ok: false, reason: "hate_violence" };
    }
  }

  // Check space-evaded tokens only if the text contains spaced single-letter sequences (e.g. "f r o c i o")
  if (/\b[a-z]\s+[a-z]\s+[a-z]\b/i.test(normalized)) {
    const compacted = compactForEvasion(normalized);
    for (const token of SPACED_EVASION_TOKENS) {
      if (compacted.includes(token)) {
        return { ok: false, reason: "hate_violence" };
      }
    }
  }

  return { ok: true };
}

export function checkCustomDeckSafety(
  title: string,
  items: string[]
): DeckModerationResult {
  const titleCheck = checkTextSafety(title);
  if (!titleCheck.ok) {
    return { ...titleCheck, offendingItem: title };
  }

  for (const item of items) {
    const res = checkTextSafety(item);
    if (!res.ok) {
      return { ...res, offendingItem: item };
    }
  }

  return { ok: true };
}
