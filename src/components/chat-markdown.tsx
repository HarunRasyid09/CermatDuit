import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const RE_LIST = /^\s*(?:[-*+]|\d+[.)])\s+\S/;
const RE_FENCE = /^\s*(?:```|~~~)/;
const RE_TABLE = /^\s*\|/;
const RE_HEAD = /^\s*#{1,6}\s/;
const RE_QUOTE = /^\s*>/;
const RE_RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const RE_CONTINUATION = /^\s{2,}\S/;

const isList = (l: string) => RE_LIST.test(l);
const isSpecial = (l: string) =>
  isList(l) || RE_TABLE.test(l) || RE_FENCE.test(l) || RE_HEAD.test(l) || RE_QUOTE.test(l) || RE_RULE.test(l);

/**
 * Makes chatbot output render cleanly as Markdown:
 * - normalizes line endings
 * - turns literal "\n" sequences into real newlines when the reply has no real ones
 * - inserts the blank lines CommonMark needs before a list and after a list block
 * - collapses runs of empty lines
 */
export function normalizeMarkdown(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n").replace(/\t/g, "  ");
  if (!text.includes("\n") && text.includes("\\n")) {
    text = text.replace(/\\n/g, "\n");
  }

  const lines = text.split("\n");
  const out: string[] = [];
  let inFence = false;
  let inListBlock = false;
  let inTableBlock = false;
  let prev = "";

  for (const line of lines) {
    if (RE_FENCE.test(line)) inFence = !inFence;

    const blank = !line.trim();
    const list = isList(line);
    const table = RE_TABLE.test(line);
    const continuation = !blank && !list && !table && RE_CONTINUATION.test(line);

    if (!inFence && !blank && prev.trim() && !isSpecial(prev)) {
      if (list && !inListBlock) out.push("");
      if (table && !inTableBlock) out.push("");
    }
    if (!inFence && !blank && !list && !table && !continuation && (inListBlock || inTableBlock)) {
      out.push("");
    }

    out.push(line);
    prev = line;

    if (!blank) {
      inListBlock = list || (continuation && inListBlock);
      inTableBlock = table || (continuation && inTableBlock);
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const components: Components = {
  p: ({ children }) => <p className="my-4 leading-[1.75] first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="mt-6 mb-3 text-[1.35em] font-semibold leading-snug first:mt-0 last:mb-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-3 text-[1.25em] font-semibold leading-snug first:mt-0 last:mb-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 text-[1.15em] font-semibold leading-snug first:mt-0 last:mb-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-5 mb-2 text-[1.08em] font-semibold leading-snug first:mt-0 last:mb-0">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-4 mb-2 text-[1.04em] font-semibold first:mt-0 last:mb-0">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-4 mb-2 text-[1em] font-semibold first:mt-0 last:mb-0">{children}</h6>,
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 first:mt-0 last:mb-0 marker:text-muted-foreground [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:my-2 [&_ol]:space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 first:mt-0 last:mb-0 marker:text-muted-foreground [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:my-2 [&_ol]:space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 leading-[1.7] [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">{children}</li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words font-medium text-brand underline underline-offset-4"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-brand/40 pl-4 italic text-muted-foreground first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>,
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl bg-muted p-4 text-[0.85em] leading-relaxed first:mt-0 last:mb-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit [&_code]:font-mono">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-6 border-border" />,
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} className="my-4 max-w-full rounded-xl" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto first:mt-0 last:mb-0">
      <table className="w-full border-collapse text-[0.95em]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-border bg-chat-bg px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
};

function ChatMarkdownBase({ children }: { children: string }) {
  const text = useMemo(() => normalizeMarkdown(children ?? ""), [children]);
  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export const ChatMarkdown = memo(ChatMarkdownBase);
