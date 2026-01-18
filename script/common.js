const userModel = require("../DB/models/user.model");
const fs = require("fs");
const path = require("path");
const maxStrikes = 3;
const FILE_PATH = path.join(__dirname, "../data/profanity_ar_gcc.txt");
const leoProfanity = require("leo-profanity");

let TERMS = new Set();
function hasLatin(text = "") {
  return /[A-Za-z]/.test(text);
}
function looksArabizi(text = "") {
  return /[2356789]/.test(text) && /[A-Za-z]/.test(text);
}

function normalizeArabic(input = "") {
  return input
    .toLowerCase()
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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

  const lastUser = await userModel.findOne({
    firstName: firstName,
    lastName: lastName,
  });

  let nextNumber = 100;

  if (lastUser) {
    const match = lastUser.nickName.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  return `${base}${nextNumber}`;
};
function containsBadWordsMixed(text = "") {
  if (!text) return false;

  // Arabic + Arabizi (your own strong normalization)
  if (containsBadWordsArabicWithArabizi(text)) return true;

  // English (leo built-in)
  if (leoProfanity.check(String(text))) return true;

  return false;
}

function arabiziToArabic(input = "") {
  let s = String(input).toLowerCase();

  // 1) normalize repeated letters (loooool -> loool)
  s = s.replace(/(.)\1{2,}/g, "$1$1");

  // 2) common multi-char patterns first (order matters)
  const multi = [
    // kh, sh, th, dh, gh
    [/kh/g, "خ"],
    [/gh/g, "غ"],
    [/sh/g, "ش"],
    [/ch/g, "تش"], // sometimes used for "تش" or "چ" حسب اللهجة
    [/th/g, "ث"],
    [/dh/g, "ذ"],

    // some people write "aa/ee/oo" to emphasize vowels
    [/aa/g, "ا"],
    [/ee/g, "ي"],
    [/oo/g, "و"],
  ];

  for (const [re, rep] of multi) s = s.replace(re, rep);

  // 3) digits mapping (most common Arabizi)
  const digitMap = {
    2: "ء", // همزة (sometimes أ) - tweak if needed
    3: "ع",
    "3'": "غ", // sometimes written 3'
    4: "ث", // sometimes ذ/ث depending on users
    5: "خ",
    6: "ط",
    "6'": "ظ",
    7: "ح",
    "7'": "خ", // sometimes 7' for خ
    8: "ق", // Gulf sometimes 8 = ق
    9: "ص",
    "9'": "ض",
  };

  // handle prime variants first
  s = s.replace(/3'/g, digitMap["3'"]);
  s = s.replace(/6'/g, digitMap["6'"]);
  s = s.replace(/7'/g, digitMap["7'"]);
  s = s.replace(/9'/g, digitMap["9'"]);

  // then single digits
  s = s.replace(/[23456789]/g, (d) => digitMap[d] || d);

  // 4) remaining latin letters -> approximate Arabic
  // (kept simple; you can tune for your audience)
  const letterMap = {
    a: "ا",
    b: "ب",
    c: "ك", // sometimes س but we already handled "ch"
    d: "د",
    e: "ي", // crude, but helps catch insults
    f: "ف",
    g: "ج", // sometimes ق/غ in some dialects
    h: "ه",
    i: "ي",
    j: "ج",
    k: "ك",
    l: "ل",
    m: "م",
    n: "ن",
    o: "و",
    p: "ب",
    q: "ق",
    r: "ر",
    s: "س",
    t: "ت",
    u: "و",
    v: "ف",
    w: "و",
    x: "كس", // often used like "x" = "كس" (insult-related)
    y: "ي",
    z: "ز",
  };

  s = s.replace(/[a-z]/g, (ch) => letterMap[ch] || ch);

  return s;
}
function containsBadWordsArabicWithArabizi(text = "") {
  if (!text) return false;

  if (containsBadWords(text)) return true;

  if (!looksArabizi(text)) return false;

  const converted = arabiziToArabic(text);
  return containsBadWords(converted);
}

const contactUsLinks = [
  {
    title: "WhatsApp",
    url: "https://wa.me/201000000000",
    logo: "https://cdn.simpleicons.org/whatsapp/25D366",
  },
  {
    title: "Instagram",
    url: "https://instagram.com/yourpage",
    logo: "https://cdn.simpleicons.org/instagram/E4405F",
  },
  {
    title: "Facebook",
    url: "https://facebook.com/yourpage",
    logo: "https://cdn.simpleicons.org/facebook/1877F2",
  },
  {
    title: "YouTube",
    url: "https://youtube.com/@yourchannel",
    logo: "https://cdn.simpleicons.org/youtube/FF0000",
  },
  {
    title: "Email",
    url: "mailto:support@yourapp.com",
    logo: "https://cdn.simpleicons.org/gmail/EA4335",
  },
];

module.exports = {
  GCC_ISO: ["SA", "AE", "KW", "QA", "BH", "OM"],
  generateNickname,
  containsBadWords,
  addTerm,
  normalizeArabic,
  maxStrikes,
  containsBadWordsMixed,
  contactUsLinks,
};
