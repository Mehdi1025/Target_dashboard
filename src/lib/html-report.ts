export type ParsedHtmlReport = {
  markup: string;
};

export function stripScriptsFromHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").trim();
}

export function preparePublicReport(html: string): ParsedHtmlReport {
  const isFullDocument = /<html[\s>]/i.test(html);

  if (!isFullDocument) {
    return { markup: stripScriptsFromHtml(html) };
  }

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const headContent = headMatch?.[1] ?? "";
  const bodyContent = bodyMatch?.[1] ?? html;

  return { markup: stripScriptsFromHtml(`${headContent}${bodyContent}`) };
}
