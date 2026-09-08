// Encrypt the deck pages with a password. Usage: DECK_PASSWORD=xxx node build.mjs
import { webcrypto as wc } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const pw = process.env.DECK_PASSWORD; if (!pw) { console.error("set DECK_PASSWORD"); process.exit(1); }
const enc = new TextEncoder();
const salt = wc.getRandomValues(new Uint8Array(16));
const base = await wc.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveKey"]);
const key = await wc.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const b64 = (u8) => Buffer.from(u8).toString("base64");
mkdirSync("enc", { recursive: true });
const loader = readFileSync("src/_loader.html", "utf8");
const pages = ["index", "answer", "wanaka", "effect", "presenter"];
for (const p of pages) {
  let html = readFileSync(`src/${p}.html`, "utf8");
  if (p === "presenter") html = html.replace('<script src="qa.js"></script>', "<script>" + readFileSync("src/qa.js", "utf8") + "</script>");
  const iv = wc.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await wc.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(html)));
  writeFileSync(`enc/${p}.json`, JSON.stringify({ salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
  const title = (html.match(/<title>(.*?)<\/title>/) || [, "Case Review"])[1];
  writeFileSync(`${p}.html`, loader.replace(/__PAGE__/g, p).replace(/__TITLE__/g, title));
  console.log("encrypted", p, ct.length);
}
