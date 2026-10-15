/**
 * Monetization gate for Google AdSense.
 *
 * apps/web has no test runner, so this is the check: `node scripts/ads-checks.mjs` (or
 * `npm run ads`). It exists because the failure mode of ad code is silent — a slot with an invalid
 * ID, a bundle that lost its build-time env, or a second copy of ads.txt all look completely fine in
 * a browser and simply never earn.
 *
 * Two kinds of check run here:
 *   1. Behaviour of src/lib/ads.ts, evaluated in a fresh child process per environment so the
 *      module-level reads are genuinely the ones a build would make.
 *   2. Shape of the tree — no account number in source, no computed env access, one ads.txt,
 *      every <AdSlot> pointing at a placement that actually exists.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_PLACEMENTS } from "../src/lib/ads.ts";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const WEB_ROOT = join(SCRIPT_DIR, "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");

let failures = 0;
let checks = 0;

function check(label, ok, expected) {
  checks += 1;
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}\n        expected: ${expected}`);
  }
}

/** Re-imports src/lib/ads.ts in a child process with exactly these env vars, and reports its answers. */
function adsUnder(env) {
  const moduleUrl = new URL("../src/lib/ads.ts", import.meta.url).href;
  const script = `
    Object.assign(process.env, ${JSON.stringify(env)});
    const m = await import(${JSON.stringify(moduleUrl)});
    const placements = ${JSON.stringify(ALL_PLACEMENTS)};
    console.log(JSON.stringify({
      client: m.getAdsenseClient(),
      enabled: m.isAdsEnabled(),
      channel: m.getAdChannel(),
      scriptUrl: m.getAdsenseScriptUrl(),
      adsTxt: m.adsTxtBody(),
      slots: Object.fromEntries(placements.map((p) => [p, m.getAdSlotId(p)])),
      heights: Object.fromEntries(placements.map((p) => [p, m.getReservedHeight(p)])),
    }));
  `;
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
    // Nothing from the developer's own shell may leak in: an unset variable has to behave as unset.
    env: { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT },
  });
  return JSON.parse(out);
}

const VALID = "ca-pub-1234567890123456";

console.log("\nAn account that is not real must load nothing\n");

const unset = adsUnder({});
check("no publisher id -> no client", unset.client === null, "null");
check("no publisher id -> ads disabled", unset.enabled === false, "false");
check("no publisher id -> no loader script", unset.scriptUrl === null, "null");
check("no publisher id -> ads.txt is empty", unset.adsTxt === "", "empty string");

const placeholder = adsUnder({ NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: "ca-pub-0000000000000000" });
check(
  "Google's all-zeros sample is refused",
  placeholder.client === null && placeholder.scriptUrl === null,
  "null client and null script url",
);

for (const bad of ["ca-pub-123", "pub-1234567890123456", "ca-pub-123456789012345a", "ca-pub-12345678901234567"]) {
  const result = adsUnder({ NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: bad });
  check(`malformed id "${bad.slice(0, 18)}…" is refused`, result.client === null, "null");
}

console.log("\nA real account turns the machinery on\n");

const live = adsUnder({
  NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: VALID,
  NEXT_PUBLIC_ADSENSE_SLOTS: "HOME_TOP=1234567890; ARTICLE_TOP=2345678901 , SIDEBAR=99 ARTICLE_MID=not-a-number BOGUS=1234567890",
  NEXT_PUBLIC_ADSENSE_CHANNEL: "travel_desk",
});
check("valid id is accepted", live.client === VALID, VALID);
check("ads run when the flag is unset", live.enabled === true, "true");
check("loader url is https and carries the account",
  live.scriptUrl === `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${VALID}`,
  "the adsbygoogle url with the client query");
check("ads.txt authorizes the same account the pages use",
  live.adsTxt === "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n",
  "google.com, pub-…, DIRECT, f08c47fec0942fa0");
check("channel passes through", live.channel === "travel_desk", "travel_desk");

console.log("\nOnly real ad unit IDs open a placement\n");

check("HOME_TOP id parsed from the list", live.slots.HOME_TOP === "1234567890", "1234567890");
check("ARTICLE_TOP parsed across a comma", live.slots.ARTICLE_TOP === "2345678901", "2345678901");
check("SIDEBAR with a 2-digit id is rejected", live.slots.SIDEBAR === null, "null - not a plausible ad unit id");
check("a non-numeric id is rejected", live.slots.ARTICLE_MID === null, "null");
check("an unknown placement name is ignored", Object.keys(live.slots).length === ALL_PLACEMENTS.length, "only the known placements are reported");
check("a placement nobody configured renders nothing", live.slots.HOME_MID === null, "null");

const off = adsUnder({ NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: VALID, NEXT_PUBLIC_ADSENSE_ENABLED: "false" });
check("the kill switch wins over a valid account", off.enabled === false, "false");

const badChannel = adsUnder({
  NEXT_PUBLIC_ADSENSE_PUBLISHER_ID: VALID,
  NEXT_PUBLIC_ADSENSE_CHANNEL: 'x"><script>1</script>',
});
check("a channel is only accepted when it is URL-safe", badChannel.channel === null, "null");

console.log("\nEvery placement reserves space so text does not jump\n");

for (const placement of ALL_PLACEMENTS) {
  const height = live.heights[placement];
  check(`${placement} reserves a real height`, typeof height === "number" && height >= 90, ">= 90px");
}

console.log("\nNo account number lives in the source tree\n");

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(path));
    else found.push(path);
  }
  return found;
}

const sourceFiles = walk(join(WEB_ROOT, "src"));
const ACCOUNT_IN_SOURCE = /ca-pub-\d{16}/g;
const offenders = [];
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(ACCOUNT_IN_SOURCE)) {
    // The all-zeros sample is the one value src/lib/ads.ts must name in order to reject it.
    if (match[0] === "ca-pub-0000000000000000" && file.endsWith(join("lib", "ads.ts"))) continue;
    offenders.push(`${relative(WEB_ROOT, file)}: ${match[0]}`);
  }
}
check("no publisher account hard-coded under src/", offenders.length === 0, `none, found: ${offenders.join(", ")}`);

const dockerfile = readFileSync(join(WEB_ROOT, "Dockerfile"), "utf8");
check("the image bakes no account number", !/ca-pub-\d{16}/.test(dockerfile), "no ca-pub-… in Dockerfile");

console.log("\nBuild-time env survives the trip to the browser\n");

const adsLib = readFileSync(join(WEB_ROOT, "src", "lib", "ads.ts"), "utf8");
// Comments are where the file explains the trap, so they have to come out before the code is
// searched for it - otherwise this check fails on its own documentation.
const adsLibCode = adsLib.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
check(
  "ads.ts never reads process.env with a computed key",
  !/process\.env\[/.test(adsLibCode),
  "only static process.env.NAME member access, which is what Next inlines",
);
check(
  "the ad unit list is read statically",
  adsLib.includes("process.env.NEXT_PUBLIC_ADSENSE_SLOTS"),
  "a literal NEXT_PUBLIC_ADSENSE_SLOTS read",
);

console.log("\nOne ads.txt, generated from the account\n");

check(
  "no static public/ads.txt competing with the route",
  !existsSync(join(WEB_ROOT, "public", "ads.txt")),
  "the file must not exist",
);
const adsTxtRoute = readFileSync(join(WEB_ROOT, "src", "app", "ads.txt", "route.ts"), "utf8");
check("the ads.txt route derives its content", adsTxtRoute.includes("adsTxtBody()"), "a call to adsTxtBody()");
check("the ads.txt route stores no account number", !/pub-\d{16}/.test(adsTxtRoute), "no literal id");

const compose = readFileSync(join(REPO_ROOT, "docker-compose.yml"), "utf8");
check(
  "compose passes the publisher id into the build",
  /NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=\$\{ADSENSE_PUBLISHER_ID/.test(compose),
  "a build arg reading ADSENSE_PUBLISHER_ID from the server env",
);
check(
  "compose passes the ad unit list into the build",
  compose.includes("NEXT_PUBLIC_ADSENSE_SLOTS=${ADSENSE_SLOTS:-}"),
  "ADSENSE_SLOTS forwarded as a build arg",
);

console.log("\nSlots in the pages are slots that exist\n");

const usedPlacements = new Set();
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/<AdSlot\s+slot="([A-Z0-9_]+)"/g)) usedPlacements.add(match[1]);
}
check("at least one placement is rendered", usedPlacements.size > 0, "one or more <AdSlot slot=\"…\">");
for (const placement of usedPlacements) {
  check(
    `<AdSlot slot="${placement}"> is a known placement`,
    ALL_PLACEMENTS.includes(placement),
    `one of ${ALL_PLACEMENTS.join(", ")}`,
  );
}

const adSlot = readFileSync(join(WEB_ROOT, "src", "components", "ads", "AdSlot.tsx"), "utf8");
check("the slot requests its ad lazily, not on mount", adSlot.includes("IntersectionObserver"), "an IntersectionObserver gate before push");
check("the slot collapses when Google reports it unfilled", adSlot.includes("data-ad-status"), "the documented data-ad-status attribute");
check(
  "the slot never sends the placement name as an ad unit id",
  !/data-ad-slot=\{slot\}/.test(adSlot),
  "data-ad-slot must be the numeric id, not the label",
);
check(
  "an unconfigured placement renders nothing",
  /if \(!isActive \|\| status === "unfilled"\) return null;/.test(adSlot),
  "an early return that removes the markup entirely",
);

console.log("\nThe template documents what to set\n");

const envExample = readFileSync(join(WEB_ROOT, ".env.example"), "utf8");
for (const name of ["NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", "NEXT_PUBLIC_ADSENSE_ENABLED", "NEXT_PUBLIC_ADSENSE_SLOTS", "NEXT_PUBLIC_ADSENSE_CHANNEL"]) {
  check(`.env.example declares ${name}`, envExample.includes(name), "the variable named in the template");
}
check(
  ".env.example lists every placement",
  ALL_PLACEMENTS.every((p) => envExample.includes(p)),
  "all of " + ALL_PLACEMENTS.join(", "),
);
check(
  ".env.example ships a non-serving account",
  envExample.includes("ca-pub-0000000000000000"),
  "the all-zeros sample, so a copied template cannot serve live ads",
);
// Next's generated .gitignore has a bare `.env*`, which silently swallows the template unless the
// negation is there to cancel it - a documented variable list that never reaches a clone is worse
// than none, because it looks maintained.
const gitignore = readFileSync(join(WEB_ROOT, ".gitignore"), "utf8");
check(
  "the env template is not git-ignored",
  gitignore.includes("!.env.example"),
  "a !.env.example negation after the .env* rule",
);

console.log(`\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ""}\n`);
process.exit(failures ? 1 : 0);
