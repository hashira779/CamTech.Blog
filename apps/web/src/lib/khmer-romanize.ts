/* Khmer names → Latin letters for invitation links.

   A web link can only hold a-z, so a couple named «ហេង សុវណ្ណារិទ្ធ» needs a
   Latin spelling to get /wedding/sovannarith-bopha. This follows the way
   Cambodians usually write their names in Latin (Sovannarith, Bopha, Chantha),
   not a strict academic system, and it is only a suggestion: the couple can
   edit the link before saving. */

const INITIAL: Record<string, string> = {
  "ក": "k", "ខ": "kh", "គ": "k", "ឃ": "kh", "ង": "ng",
  "ច": "ch", "ឆ": "chh", "ជ": "ch", "ឈ": "chh", "ញ": "nh",
  "ដ": "d", "ឋ": "th", "ឌ": "d", "ឍ": "th", "ណ": "n",
  "ត": "t", "ថ": "th", "ទ": "t", "ធ": "th", "ន": "n",
  "ប": "b", "ផ": "ph", "ព": "p", "ភ": "ph", "ម": "m",
  "យ": "y", "រ": "r", "ល": "l", "វ": "v", "ស": "s",
  "ហ": "h", "ឡ": "l", "អ": "",
};

/* A consonant closing a syllable sounds softer: ខ is "k", ប is "p", រ is silent */
const FINAL: Record<string, string> = {
  "ក": "k", "ខ": "k", "គ": "k", "ឃ": "k", "ង": "ng",
  "ច": "ch", "ឆ": "ch", "ជ": "ch", "ឈ": "ch", "ញ": "nh",
  "ដ": "d", "ឋ": "th", "ឌ": "d", "ឍ": "th", "ណ": "n",
  "ត": "t", "ថ": "th", "ទ": "t", "ធ": "th", "ន": "n",
  "ប": "p", "ផ": "p", "ព": "p", "ភ": "p", "ម": "m",
  "យ": "y", "រ": "", "ល": "l", "វ": "v", "ស": "s",
  "ហ": "h", "ឡ": "l", "អ": "",
};

const VOWEL: Record<string, string> = {
  "ា": "a", "ិ": "i", "ី": "i", "ឹ": "oe", "ឺ": "eu", "ុ": "o", "ូ": "ou",
  "ួ": "uo", "ើ": "aeu", "ឿ": "oea", "ៀ": "ie", "េ": "e", "ែ": "ae",
  "ៃ": "ai", "ោ": "ao", "ៅ": "au", "័": "a",
};

const INDEPENDENT: Record<string, string> = {
  "ឥ": "e", "ឦ": "ei", "ឧ": "o", "ឩ": "ou", "ឪ": "ov", "ឫ": "rue", "ឬ": "rue",
  "ឭ": "lue", "ឮ": "lue", "ឯ": "ae", "ឰ": "ai", "ឱ": "ao", "ឲ": "ao", "ឳ": "au",
};

const COENG = "្";
const NIKAHIT = "ំ";
const REAHMUK = "ះ";
const isConsonant = (c: string | undefined) => !!c && c in INITIAL;

type Syllable = { base: string; subs: string[]; vowel: string | null };

/* Split a word into consonant clusters with whatever vowel follows each */
function syllables(word: string): (Syllable | string)[] {
  const out: (Syllable | string)[] = [];
  const chars = [...word];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (!isConsonant(c)) {
      if (c in INDEPENDENT) out.push(INDEPENDENT[c]);
      else if (/[a-z0-9]/i.test(c)) out.push(c.toLowerCase());
      else if (c >= "០" && c <= "៩") out.push(String(c.charCodeAt(0) - 0x17e0));
      continue;
    }
    const s: Syllable = { base: c, subs: [], vowel: null };
    while (chars[i + 1] === COENG && isConsonant(chars[i + 2])) {
      s.subs.push(chars[i + 2]);
      i += 2;
    }
    let v = "";
    while (i + 1 < chars.length && !isConsonant(chars[i + 1]) && !(chars[i + 1] in INDEPENDENT) && chars[i + 1] !== COENG) {
      const m = chars[++i];
      if (m in VOWEL) v += VOWEL[m];
      else if (m === NIKAHIT) v += v === "o" ? "m" : v ? "m" : "am";
      else if (m === REAHMUK) v += v ? "h" : "ah";
      // ៉ ៊ ់ ៍ and other signs change the tone, not the Latin spelling
    }
    if (v) s.vowel = v;
    out.push(s);
  }
  return out;
}

function romanizeWord(word: string): string {
  const parts = syllables(word);
  let text = "";
  let open = false; // last syllable ended in a vowel and can take a final consonant
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (typeof p === "string") {
      text += p;
      open = /[aeiou]$/.test(p);
      continue;
    }
    const next = parts[i + 1];
    const atEnd = next === undefined;
    if (p.subs.length > 0) {
      // ណ្ណា, ប្ផា: the stacked base closes the previous syllable,
      // the subscript opens the next one
      if (open) {
        text += FINAL[p.base];
        const head = p.subs[0];
        if (p.vowel) {
          text += INITIAL[head] + p.vowel;
          open = true;
        } else if (atEnd) {
          open = false;
        } else {
          text += INITIAL[head] + "a";
          open = true;
        }
      } else {
        // Starting a word (ស្រី): the stack is one initial, "sr"
        text += INITIAL[p.base] + p.subs.map((c) => INITIAL[c]).join("") + (p.vowel ?? (atEnd ? "" : "a"));
        open = !!p.vowel || !atEnd;
      }
      continue;
    }
    if (p.vowel) {
      text += INITIAL[p.base] + p.vowel;
      open = true;
      continue;
    }
    // A bare consonant: closes the open syllable before it (ចាន់, ហេង, ប៊ុនថា),
    // unless the next cluster is stacked (សុវណ្ណ: វ keeps its own "a")
    const nextStacked = typeof next === "object" && next.subs.length > 0;
    if (open && (atEnd || !nextStacked)) {
      text += FINAL[p.base];
      open = false;
    } else {
      text += INITIAL[p.base] + "a";
      open = true;
    }
  }
  // A final that only repeats the next initial is dropped: bop+pha → bopha, kanh+nha → kanha
  text = text.replace(/p(?=ph)|t(?=th)|k(?=kh)|c(?=ch)|nh(?=nh)/g, "");
  // A final ត/ទ written with a silent subscript (រ័ត្ន, រិទ្ធ) reads "th" in names
  if (/[ទត]្[^ា-ៅ]*$/.test(word) && text.endsWith("t")) text += "h";
  return text;
}

/** Each word of a name in Latin letters; empty words are dropped */
export function romanizeName(name: string): string[] {
  return name
    .trim()
    .split(/[\s&,.·/]+/)
    .map(romanizeWord)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{2,59}$/;

/** A few link ideas from the couple's names and wedding year, best first.
 *  Khmer names put the family name first, so the given names lead. */
export function suggestSlugs(groomName: string, brideName: string, solarDate?: string): string[] {
  const g = romanizeName(groomName);
  const b = romanizeName(brideName);
  const given = (w: string[]) => (w.length > 1 ? w.slice(1).join("") : w[0] ?? "");
  const gg = given(g);
  const bg = given(b);
  const year = /^\d{4}/.exec(solarDate ?? "")?.[0];
  const ideas: string[] = [];
  if (gg && bg) {
    ideas.push(`${gg}-${bg}`);
    if (year) ideas.push(`${gg}-${bg}-${year}`);
    ideas.push(`${bg}-${gg}`);
    if (g[0] && b[0] && g.length > 1 && b.length > 1 && g[0] !== b[0]) ideas.push(`${g[0]}-${b[0]}-wedding`);
    ideas.push(`${gg}-${bg}-wedding`);
  } else if (gg || bg) {
    ideas.push(`${gg || bg}-wedding`);
    if (year) ideas.push(`${gg || bg}-${year}`);
  }
  return [...new Set(ideas.map((s) => s.slice(0, 60)))].filter((s) => SLUG_RE.test(s)).slice(0, 4);
}
