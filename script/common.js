const userModel = require("../DB/models/user.model");
const fs = require("fs");
const path = require("path");
 const maxStrikes = 3;
const FILE_PATH = path.join(__dirname, "../data/profanity_ar_gcc.txt");

let TERMS = new Set();

function normalizeArabic(input = "") {
  return (
    input
      .toLowerCase()
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
      .replace(/\u0640/g, "")
      .replace(/[إأآٱ]/g, "ا")
      .replace(/[ىي]/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\p{L}\p{N}\s+]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function loadTermsFromFile() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      TERMS = new Set();
      return;
    }

    const lines = fs.readFileSync(FILE_PATH, "utf8").split(/\r?\n/);
    const cleaned = lines.map((l) => normalizeArabic(l.trim())).filter(Boolean);

    TERMS = new Set(cleaned);

  } catch (err) {
    console.error("[profanity_kw] failed to load:", err.message);
  }
}

// initial load
loadTermsFromFile();

// hot reload (works on Windows too)
fs.watch(FILE_PATH, { persistent: false }, () => {
  // small debounce to avoid double triggers on some editors
  setTimeout(loadTermsFromFile, 100);
});

/**
 * Simple match:
 * - phrase includes (normalized)
 * - whole word match can be added later if needed
 */
function containsBadWords(text = "") {
  const t = normalizeArabic(text);
  if (!t) return false;

  for (const term of TERMS) {
    if (term && t.includes(term)) return true;
  }
  return false;
}

/**
 * Add a term to file + memory (private moderation workflow)
 */
function addTerm(termRaw = "") {
  const term = normalizeArabic(termRaw);
  if (!term) return { ok: false, reason: "empty" };

  if (TERMS.has(term)) return { ok: true, existed: true };

  // Append to file (one per line)
  fs.appendFileSync(FILE_PATH, `\n${term}`, "utf8");
  TERMS.add(term);

  return { ok: true, existed: false };
}

const generateNickname = async (firstName, lastName) => {
  const base = `${firstName}${lastName}`.replace(/\s+/g, "");

  // Find the last created user with same base nickname
  const lastUser = await userModel
    .findOne({ nickname: new RegExp(`^${base}`) })
    .sort({ nickname: -1 })
    .select("nickname");

  let nextNumber = 100; // 👈 start from 100

  if (lastUser) {
    const lastNumber = parseInt(lastUser.nickname.slice(base.length), 10);
    nextNumber = lastNumber + 1;
  }

  return `${base}${nextNumber}`;
};

module.exports = {
  GCC_ISO: ["SA", "AE", "KW", "QA", "BH", "OM"],
  generateNickname,
  containsBadWords,
  addTerm,
  normalizeArabic,
  maxStrikes
};
