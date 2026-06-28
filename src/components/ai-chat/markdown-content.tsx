"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { sanitizeUrl } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const rehypeSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["href", /^(?!(?:javascript|data|vbscript|blob):)/i],
    ],
  },
};

function sanitizeMarkdownImages(content: string): string {
  return content.replace(/!\[[^\]]*]\(\s*\)/g, "");
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const safeContent = sanitizeMarkdownImages(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, rehypeSanitizeSchema]]}
      className={cn("prose-ai", className)}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>,
        li: ({ children }) => <li className="text-[14px] leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-[#111827]">{children}</strong>,
        code: ({ className: codeClass, children, ...props }) => {
          const isBlock = codeClass?.includes("language-");
          if (isBlock) {
            return (
              <code
                className="block overflow-x-auto rounded-lg bg-[#111827] px-3 py-2 text-[13px] text-[#f0fdf4]"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="rounded bg-[#e5e7eb]/80 px-1 py-0.5 font-mono text-[13px] text-[#111827]"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg bg-[#111827] p-3 text-[13px]">
            {children}
          </pre>
        ),
        a: ({ href, children }) => {
          const safeHref = href ? sanitizeUrl(href) : undefined;
          if (!safeHref || safeHref === "#") {
            return <span className="text-[#16a34a]">{children}</span>;
          }
          return (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#16a34a] underline underline-offset-2 hover:text-[#15803d]"
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => {
          if (typeof src !== "string" || !src.trim()) return null;
          const safeSrc = sanitizeUrl(src);
          if (safeSrc === "#") return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeSrc}
              alt={alt ?? "Изображение"}
              className="my-2 max-h-[480px] w-auto max-w-full rounded-xl border border-[#e5e7eb] object-contain"
            />
          );
        },
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
}
