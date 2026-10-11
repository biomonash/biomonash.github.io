import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function getPageTitle(page: PageObjectResponse): string {
  // Every Notion database has exactly one "title" column, but it can be
  // named anything ("Name", "Full Name", ...), so find it by type.
  const title = Object.values(page.properties).find(
    (prop) => prop.type === "title",
  );
  if (title && title.type === "title") {
    return title.title.map((text) => text.plain_text).join("");
  }
  throw Error(`Page ${page.id} has no title property.`);
}

export async function getCoverLink(
  page_id: string,
  notion: Client,
): Promise<string | null> {
  const page = await notion.pages.retrieve({ page_id });
  if (!isFullPage(page) || page.cover === null) {
    return null;
  }
  return page.cover.type === "external"
    ? page.cover.external.url
    : pageIdToApiUrl(page_id);
}

export function getFileName(title: string, page_id: string): string {
  return (
    title.replaceAll(" ", "-").replace(/--+/g, "-") +
    "-" +
    page_id.replaceAll("-", "") +
    ".md"
  );
}