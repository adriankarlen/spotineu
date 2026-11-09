#!/usr/bin/env node
// Static checks for the Spicetify theme in ./theme (or the folder given as argv[2]).
// No dependencies. Exit code 1 on errors, 0 otherwise (warnings do not fail).
//
//   node scripts/check-theme.mjs [themeDir] [--scheme <name>] [--no-selectors]

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1] === "--scheme"));
const themeDir = resolve(positional[0] ?? "theme");

// Mirrors BaseColorList in spicetify/cli src/utils/color.go. Missing keys fall back to these
// (Spotify green etc.), which is almost never what a theme wants.
const BASE_KEYS = [
  "text", "subtext", "main", "main-elevated", "highlight", "highlight-elevated",
  "sidebar", "player", "card", "shadow", "selected-row", "button", "button-active",
  "button-disabled", "tab-active", "notification", "notification-error", "misc",
];

// Custom keys the spotineu design language needs in every scheme (see spotineu-design skill).
const DESIGN_KEYS = ["neu-light", "neu-dark", "on-accent"];

const errors = [];
const warnings = [];
const notes = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const note = (m) => notes.push(m);

if (!existsSync(themeDir) || !statSync(themeDir).isDirectory()) {
  console.error(`✖ Theme folder not found: ${themeDir}`);
  process.exit(1);
}

// ---------- color.ini ----------
const colorPath = join(themeDir, "color.ini");
const schemes = new Map(); // name -> Map(key -> {value, line})
if (!existsSync(colorPath)) {
  err("color.ini is missing (required).");
} else {
  let current = null;
  readFileSync(colorPath, "utf8").split(/\r?\n/).forEach((raw, idx) => {
    const line = raw.trim();
    const ln = idx + 1;
    if (!line || line.startsWith(";") || line.startsWith("#")) return;
    const section = line.match(/^\[([^\]]+)\]$/);
    if (section) {
      current = section[1].trim();
      if (schemes.has(current)) warn(`color.ini:${ln} duplicate scheme [${current}]`);
      else schemes.set(current, new Map());
      return;
    }
    const kv = line.match(/^([^=]+?)\s*=\s*(.*?)\s*(?:[;#].*)?$/);
    if (!kv) return err(`color.ini:${ln} cannot parse line: ${raw}`);
    if (!current) return err(`color.ini:${ln} key "${kv[1]}" is outside any [scheme] section`);
    const [, key, value] = kv;
    const scheme = schemes.get(current);
    if (scheme.has(key)) warn(`color.ini:${ln} duplicate key "${key}" in [${current}]`);
    scheme.set(key, { value, line: ln });
    if (!/^[a-z0-9-]+$/.test(key)) warn(`color.ini:${ln} key "${key}" is not lowercase-kebab; the CSS variable will be --spice-${key}`);
    // Spicetify reads color.ini with go-ini, where any # or ; starts an inline comment.
    // So `main = #1e1e2e` becomes an empty value and silently renders as the default/white.
    if (/=\s*#/.test(line)) {
      err(`color.ini:${ln} [${current}] ${key}: a leading "#" starts a comment in Spicetify's INI parser, so the value is empty. Write the hex without "#"`);
      return;
    }
    const problem = checkColorValue(value);
    if (problem) err(`color.ini:${ln} [${current}] ${key} = "${value}": ${problem}`);
  });

  if (schemes.size === 0) err("color.ini has no [scheme] sections.");
  for (const [name, keys] of schemes) {
    const missing = BASE_KEYS.filter((k) => !keys.has(k));
    if (missing.length) warn(`[${name}] missing base keys (Spotify defaults will leak in): ${missing.join(", ")}`);
    const missingDesign = DESIGN_KEYS.filter((k) => !keys.has(k));
    if (missingDesign.length) warn(`[${name}] missing design keys (neumorphic shadows will be undefined): ${missingDesign.join(", ")}`);
    const custom = [...keys.keys()].filter((k) => !BASE_KEYS.includes(k));
    if (custom.length) note(`[${name}] custom keys: ${custom.map((k) => `--spice-${k}`).join(", ")}`);
  }
  // Custom keys should exist in every scheme, otherwise var() is undefined in some schemes.
  const allCustom = new Set([...schemes.values()].flatMap((m) => [...m.keys()].filter((k) => !BASE_KEYS.includes(k))));
  for (const key of allCustom) {
    const without = [...schemes].filter(([, m]) => !m.has(key)).map(([n]) => n);
    if (without.length) warn(`custom key "${key}" is missing from scheme(s): ${without.join(", ")}`);
  }
  const wanted = opt("--scheme");
  if (wanted && !schemes.has(wanted)) {
    err(`--scheme "${wanted}" not found; Spicetify would silently fall back to the first scheme [${[...schemes.keys()][0]}]`);
  }
}

function checkColorValue(v) {
  if (/^\$\{xrdb:[^}]+\}$/.test(v)) return null; // Linux XResources; can't verify here
  const env = v.match(/^\$\{([^}:]+)\}$/);
  if (env) return process.env[env[1]] ? checkColorValue(process.env[env[1]]) : `env var ${env[1]} is not set (value would be garbage)`;
  if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;
  const dec = v.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (dec) return dec.slice(1).every((n) => +n <= 255) ? null : "decimal channels must be 0-255";
  if (/^[0-9a-fA-F]{8}$/.test(v)) return "alpha hex (8 digits) is not supported; alpha is dropped. Use rgba(var(--spice-rgb-*), a) in CSS";
  return "not a valid colour (use hex without # like 1e1e2e or fff, or r,g,b)";
}

// ---------- user.css ----------
const cssPath = join(themeDir, "user.css");
let css = "";
if (!existsSync(cssPath)) {
  err("user.css is missing (required, may be empty).");
} else {
  css = readFileSync(cssPath, "utf8");
  checkCssSyntax(css);

  const defined = new Set([...BASE_KEYS, ...[...schemes.values()].flatMap((m) => [...m.keys()])]);
  // Variables the theme defines itself (e.g. --spice-foo: ... in :root) count as defined.
  for (const m of css.matchAll(/(--spice-(?:rgb-)?[a-z0-9-]+)\s*:/g)) defined.add(m[1].replace(/^--spice-(rgb-)?/, ""));
  for (const m of css.matchAll(/var\(\s*--spice-(rgb-)?([a-z0-9-]+)/g)) {
    if (!defined.has(m[2])) warn(`user.css:${lineOf(css, m.index)} var(--spice-${m[1] ?? ""}${m[2]}) is not defined in color.ini`);
  }
  for (const m of css.matchAll(/rgba?\(\s*var\(--spice-(?!rgb-)([a-z0-9-]+)\)\s*,/g)) {
    err(`user.css:${lineOf(css, m.index)} rgba(var(--spice-${m[1]}), …) uses the hex variable; use --spice-rgb-${m[1]}`);
  }

  checkDesignTokens(css);

  const importantCount = (css.match(/!important/g) || []).length;
  if (importantCount > 40) note(`user.css uses !important ${importantCount} times; prefer raising specificity where you can`);

  // Hashed/obfuscated class names break on every Spotify update.
  const selectorText = stripBlocks(stripComments(css));
  const classes = new Set([...selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const hashed = [...classes].filter((c) => (/^[A-Za-z0-9_]{20}$/.test(c) && /\d/.test(c) && /[A-Z]/.test(c)) || /^e-\d{4,}/.test(c));
  if (hashed.length) {
    warn(`${hashed.length} selector(s) use build-hashed class names that change with Spotify updates; prefer data-testid, roles, encore-* or readable classes, and keep these in a "fragile" section: ${hashed.map((c) => "." + c).join(", ")}`);
  }
  if (!flag("--no-selectors")) checkSelectorsExist(classes);
}

// Outside the "/* ==== Tokens" section, component rules must use tokens:
// no literal colours, shadows must come from --sn-* tokens, radii from tokens.
function checkDesignTokens(src) {
  const clean = stripComments(src);
  const tokenStart = src.search(/\/\*\s*=+\s*Tokens\b/i);
  let tokenEnd = -1;
  if (tokenStart >= 0) {
    const rest = src.slice(tokenStart + 2);
    const next = rest.search(/\/\*\s*=+\s*(?!Tokens\b)\w/i);
    tokenEnd = next >= 0 ? tokenStart + 2 + next : src.length;
  } else if (/\S/.test(clean)) {
    note('user.css has no "/* ==== Tokens ==== */" section; the design-token check applies to the whole file');
  }
  const inTokens = (i) => tokenStart >= 0 && i >= tokenStart && i < tokenEnd;
  const report = new Map();
  const add = (kind, i, text) => {
    if (inTokens(i)) return;
    if (!report.has(kind)) report.set(kind, []);
    report.get(kind).push(`${lineOf(src, i)} (${text.trim().slice(0, 60)})`);
  };
  for (const m of clean.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/g)) {
    const [, prop, value] = m;
    if (prop.startsWith("--")) continue;
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/.test(value)) add("literal colour", m.index, `${prop}: ${value}`);
    if (prop === "box-shadow" && !/^\s*(none|unset|initial|inherit)\b/.test(value) && !/var\(--sn-/.test(value)) add("box-shadow without --sn-* token", m.index, `${prop}: ${value}`);
    if (/^border(-[a-z]+)*-radius$/.test(prop) && /\d+px/.test(value) && !/var\(--sn-/.test(value) && !/^\s*0(px)?\s*$/.test(value)) add("literal radius", m.index, `${prop}: ${value}`);
  }
  for (const [kind, where] of report) warn(`design tokens: ${kind} outside the Tokens section at user.css:${where.join(", ")}`);
}

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
}
function stripBlocks(s) {
  // Remove declaration bodies but keep nested at-rule selectors: drop innermost {...} repeatedly.
  let prev;
  do { prev = s; s = s.replace(/\{[^{}]*\}/g, ";"); } while (s !== prev);
  return s.replace(/@[^;{]*/g, " ").replace(/url\([^)]*\)/g, " ");
}
function lineOf(s, index) {
  return s.slice(0, index).split("\n").length;
}
function checkCssSyntax(s) {
  const src = stripComments(s);
  if (/\/\*/.test(src)) err("user.css has an unterminated /* comment");
  let depth = 0, line = 1, quote = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\n") line++;
    if (quote) { if (ch === "\\") i++; else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth < 0) { err(`user.css:${line} unexpected "}"`); depth = 0; } }
  }
  if (quote) err("user.css has an unterminated string");
  if (depth > 0) err(`user.css has ${depth} unclosed "{"`);
}

function spotifyXpuiDir() {
  try {
    const p = execFileSync("spicetify", ["config", "spotify_path"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const dir = join(p, "Apps", "xpui");
    return existsSync(dir) ? dir : null;
  } catch {
    return null;
  }
}

function checkSelectorsExist(classes) {
  const dir = spotifyXpuiDir();
  if (!dir) return note("Skipped selector existence check (could not find Spotify's Apps/xpui via `spicetify config spotify_path`).");
  let haystack = "";
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      const st = statSync(p);
      if (st.isDirectory()) { if (f !== "extensions" && f !== "i18n") walk(p); }
      else if (/\.(css|js)$/.test(f) && f !== "user.css" && f !== "colors.css") haystack += readFileSync(p, "utf8");
    }
  };
  walk(dir);
  // sn-* classes are added by our own theme.js, so they are not in Spotify's bundle.
  const missing = [...classes].filter((c) => !c.startsWith("sn-") && !haystack.includes(c));
  if (missing.length) {
    warn(`classes not found in the installed Spotify build (typo, removed by a Spotify update, or added by theme.js): ${missing.map((c) => "." + c).join(", ")}`);
  }
}

// ---------- theme.js ----------
const jsPath = join(themeDir, "theme.js");
if (existsSync(jsPath)) {
  try {
    execFileSync(process.execPath, ["--check", jsPath], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    err(`theme.js has a syntax error:\n${String(e.stderr).trim()}`);
  }
}

// ---------- assets ----------
if (existsSync(join(themeDir, "assets"))) {
  try {
    const v = execFileSync("spicetify", ["config", "overwrite_assets"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (v !== "1") warn("theme has assets/ but overwrite_assets is not 1; assets will not be copied. Run: spicetify config overwrite_assets 1");
  } catch { /* spicetify not available */ }
}

// ---------- report ----------
for (const m of errors) console.log(`✖ ${m}`);
for (const m of warnings) console.log(`⚠ ${m}`);
for (const m of notes) console.log(`ℹ ${m}`);
console.log(`\n${themeDir}: ${errors.length} error(s), ${warnings.length} warning(s), ${schemes.size} scheme(s)`);
process.exit(errors.length ? 1 : 0);
