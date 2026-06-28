import DOMPurify from "isomorphic-dompurify";

const ALLOWED_MARKDOWN_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const DANGEROUS_URL_SCHEMES = ["javascript:", "data:", "vbscript:", "blob:"];

/** Block dangerous URL schemes (javascript:, data:, etc.). */
export function sanitizeUrl(url: string): string {
  const lower = url.toLowerCase().trim();
  for (const scheme of DANGEROUS_URL_SCHEMES) {
    if (lower.startsWith(scheme)) return "#";
  }
  return url;
}

/** Strip dangerous schemes from markdown link targets: [text](url) */
function sanitizeMarkdownLinks(input: string): string {
  return input.replace(
    /\[([^\]]*)\]\(([^)]*)\)/g,
    (_match, text: string, url: string) => `[${text}](${sanitizeUrl(url)})`
  );
}

/** Strip all HTML for plain-text fields (names, phones, titles). */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/** Allow safe markdown-related tags; strip scripts and event handlers. */
export function sanitizeMarkdown(input: string): string {
  const withSafeLinks = sanitizeMarkdownLinks(input);
  const purified = DOMPurify.sanitize(withSafeLinks, {
    ALLOWED_TAGS: ALLOWED_MARKDOWN_TAGS,
    ALLOWED_ATTR: ["href", "title", "class"],
    ALLOW_DATA_ATTR: false,
  }).trim();

  return purified.replace(
    /href="([^"]*)"/gi,
    (_match, href: string) => `href="${sanitizeUrl(href)}"`
  );
}

/** Sanitize user content before sending to AI APIs. */
export function sanitizeAiPrompt(input: string): string {
  return sanitizeMarkdown(input).slice(0, 32_000);
}
