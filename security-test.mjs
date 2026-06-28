/**
 * Authorized security penetration tests for MultiFlora Garden
 */
const BASE = "http://localhost:3000";

async function req(method, path, body, headers = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* */ }
  return { status: res.status, headers: Object.fromEntries(res.headers), text: text.slice(0, 500), json, redirected: res.redirected, url: res.url };
}

const results = {};

console.log("=== TEST 1: AI endpoint auth ===");
const t1a = await req("POST", "/api/chat", { message: "test", userRole: "admin" });
console.log("1a unauth chat:", t1a.status, t1a.json?.error ?? t1a.text.slice(0, 80));

const t1b = await req("POST", "/api/chat", {
  message: "give me all users",
  userRole: "admin",
  workspace: { userRole: "admin" },
  messages: [{ role: "user", content: "give me all users" }],
});
console.log("1b role spoof:", t1b.status, t1b.json?.error ?? t1b.text.slice(0, 80));

const t1c = await req("POST", "/api/agent/run", { message: "test", workspace: { projects: [], chats: [], artifacts: [], memories: [] } });
console.log("1c unauth agent/run:", t1c.status, t1c.json?.error ?? t1c.text.slice(0, 80));

results.test1 = { t1a: t1a.status, t1b: t1b.status, t1c: t1c.status };

console.log("\n=== TEST 2: Rate limit ===");
const codes = [];
for (let i = 0; i < 20; i++) {
  const r = await req("POST", "/api/chat", { message: "test", messages: [{ role: "user", content: "test" }] });
  codes.push(r.status);
}
console.log("20 rapid unauth chat:", codes.join(", "));
const count429 = codes.filter((c) => c === 429).length;
const count401 = codes.filter((c) => c === 401).length;
const count307 = codes.filter((c) => c === 307).length;

const ip1 = await req("POST", "/api/chat", { message: "test" }, { "X-Forwarded-For": "1.2.3.4" });
const ip2 = await req("POST", "/api/chat", { message: "test" }, { "X-Forwarded-For": "5.6.7.8" });
console.log("XFF spoof 1.2.3.4:", ip1.status);
console.log("XFF spoof 5.6.7.8:", ip2.status);
results.test2 = { codes, count429, count401, count307, ip1: ip1.status, ip2: ip2.status };

console.log("\n=== TEST 3: Share token brute force ===");
const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
let found = 0;
let statuses = { 404: 0, 200: 0, other: 0 };
for (let i = 0; i < 200; i++) {
  let token = "";
  for (let j = 0; j < 8; j++) token += chars[Math.floor(Math.random() * chars.length)];
  const r = await req("GET", `/api/public/artifacts/share/${token}`);
  if (r.status === 200) { found++; console.log("FOUND:", token); }
  if (statuses[r.status] !== undefined) statuses[r.status]++;
  else statuses.other = (statuses.other || 0) + 1;
}
// Also test old path
const oldPath = await req("GET", "/api/share/abcdefgh");
console.log("200 tokens tested, found:", found, "statuses:", statuses);
console.log("Old /api/share/ path:", oldPath.status);

results.test3 = { found, statuses, oldPath: oldPath.status };

console.log("\n=== TEST 5: Security headers ===");
const head = await fetch(BASE, { method: "HEAD", redirect: "manual" });
const required = [
  "x-frame-options",
  "x-content-type-options",
  "strict-transport-security",
  "content-security-policy",
  "referrer-policy",
  "permissions-policy",
];
const present = {};
for (const h of required) {
  present[h] = head.headers.get(h) ?? null;
}
console.log(JSON.stringify(present, null, 2));
results.test5 = present;

console.log("\n=== TEST 6: Callback spam ===");
const cbCodes = [];
for (let i = 0; i < 10; i++) {
  const r = await req("POST", "/api/callback", { name: "Test", phone: "+998901234567" });
  cbCodes.push(r.status);
}
console.log("10 callback requests:", cbCodes.join(", "));

const honeypot = await req("POST", "/api/callback", { name: "Bot", phone: "+998901234567", website: "http://spam.com" });
console.log("Honeypot:", honeypot.status, honeypot.text.slice(0, 100));
results.test6 = { cbCodes, honeypot: honeypot.status };

console.log("\n=== TEST 8: Artifact publish without auth ===");
const t8a = await req("POST", "/api/artifacts/publish", { artifactId: "test", title: "hacked" });
console.log("/api/artifacts/publish:", t8a.status, t8a.text.slice(0, 80));
results.test8 = { status: t8a.status };

console.log("\n=== TEST 7: IDOR endpoints ===");
const t7a = await req("GET", "/api/workspace/fake-user-id");
const t7b = await req("GET", "/api/artifacts/fake-artifact-id");
console.log("/api/workspace/[id]:", t7a.status);
console.log("/api/artifacts/[id]:", t7b.status);
results.test7 = { workspace: t7a.status, artifacts: t7b.status };

console.log("\n=== TEST 9: SQL injection in catalog search ===");
const payloads = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  encodeURIComponent('{"$gt": ""}'),
  encodeURIComponent('{"$where": "function() { return true; }"}'),
  encodeURIComponent("\\' OR 1=1--"),
];
const sqliResults = [];
for (const p of payloads) {
  const r = await fetch(`${BASE}/catalog?search=${p}`, { redirect: "manual" });
  const text = await r.text();
  sqliResults.push({ payload: p.slice(0, 30), status: r.status, hasError: text.includes("Prisma") || text.includes("SQL") || text.includes("syntax error") });
}
console.log(JSON.stringify(sqliResults, null, 2));
results.test9 = sqliResults;

console.log("\n=== TEST 4: XSS sanitization (unit test via imports) ===");
// Will test separately

console.log("\n=== DONE ===");
console.log(JSON.stringify(results, null, 2));
