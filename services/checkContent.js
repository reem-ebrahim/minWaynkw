const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------ NORMALIZE ARABIC (KUWAIT SAFE) ------------------ */
function normalizeArabic(text = "") {
  return text
    .toLowerCase()
    .replace(/ـ+/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/(.)\1+/g, "$1")
    .trim();
}

/* ------------------ CORE MODERATION ------------------ */
async function moderateText(text, retry = 1) {
  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: normalizeArabic(text),
    });

    const result = response.results[0];

    return {
      ok: true,
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
    };

  } catch (err) {
    /* ---------- RATE LIMIT ---------- */
    if (err.status === 429) {
      if (retry > 0) {
        // ⏳ wait 1 second then retry once
        await new Promise(r => setTimeout(r, 1000));
        return moderateText(text, retry - 1);
      }

      return {
        ok: false,
        rateLimited: true,
        flagged: false,
      };
    }

    /* ---------- OTHER ERRORS ---------- */
    console.error("Moderation error:", err.message);
    return {
      ok: false,
      error: true,
      flagged: false,
    };
  }
}

/* ------------------ TEXT + IMAGE ------------------ */
async function moderateTextAndImage(text, imageUrl, retry = 1) {
  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        { type: "text", text: normalizeArabic(text) },
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ],
    });

    const result = response.results[0];

    return {
      ok: true,
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
      appliedTo: result.category_applied_input_types,
    };

  } catch (err) {
    if (err.status === 429) {
      if (retry > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return moderateTextAndImage(text, imageUrl, retry - 1);
      }

      return {
        ok: false,
        rateLimited: true,
        flagged: false,
      };
    }

    console.error("Moderation error:", err.message);
    return {
      ok: false,
      error: true,
      flagged: false,
    };
  }
}

module.exports = {
  moderateText,
  moderateTextAndImage,
};
