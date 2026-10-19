import fs from "fs-extra";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "./markdown/notion-to-md";
import YAML from "yaml";
import { DatabaseMount, PageMount } from "./config";
import { getPageTitle, getFileName } from "./helpers";
import path from "path";
import { getContentFile } from "./file";
import https from "https";

async function downloadFile(url: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        reject(
          new Error(
            `Failed to download ${url}: HTTP ${response.statusCode}`,
          ),
        );
        return;
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (error) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(error);
    });
  });
}

// For the members folder, only these Notion columns are written to the files.
// Everything else (emails, phone numbers, etc.) is left out because the repo is public.
// Matching ignores case and extra spaces.
const PUBLIC_PROPERTIES: Record<string, string[]> = {
  members: [
    "Preferred Name",
    "Role",
    "Departments",
    "Administrative Status",
    "LinkedIn",
  ],
  executives: ["FullName","Role", "Department", "Image", "Order"],
  advisors: ["Role", "Department", "Link", "Image"],
  // "Current Person(s)" is deliberately left out (names of people in roles)
  roles: [
    "Role Description",
    "Department",
    "Expected Skills",
    "Responsibilities",
  ],
};

// Folders whose photos are saved per person (static/images/<folder>/<page id>.jpg)
// so two people uploading "photo.jpg" can't overwrite each other.
const PER_PAGE_IMAGES = ["executives", "advisors", "members"];

function imageWebPath(
  folder: string,
  pageId: string,
  fileName: string,
  index: number,
): string {
  if (!PER_PAGE_IMAGES.includes(folder)) return `/images/${fileName}`;
  const ext = path.extname(fileName).toLowerCase() || ".jpg";
  const suffix = index === 0 ? "" : `-${index}`;
  return `/images/${folder}/${pageId.replaceAll("-", "")}${suffix}${ext}`;
}

function normalise(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function isAllowed(folder: string, property: string): boolean {
  const allow = PUBLIC_PROPERTIES[folder];
  if (!allow) return true; // other folders keep their existing behaviour
  return allow.map(normalise).includes(normalise(property));
}

export async function renderPage(
  page: PageObjectResponse,
  notion: Client,
  folder: string = ".",
) {
  const restricted = folder in PUBLIC_PROPERTIES;
  // load formatter config
  const n2m = new NotionToMarkdown({ notionClient: notion });
  n2m.setUnsupportedTransformer((type) => {
    return `{{< notion-unsupported-block type=${type} >}}`;
  });
  let frontInjectString = "";
  const mdblocks = await n2m.pageToMarkdown(page.id);
  const mdString = n2m.toMarkdownString(mdblocks);
  const title = getPageTitle(page);
  const frontMatter: Record<
    string,
    string | string[] | number | boolean | object | PageObjectResponse
  > = {
    title,
    date: page.created_time,
    lastmod: page.last_edited_time,
    draft: false,
  };

  // set featuredImage
  // (the page object already has the cover, no need to fetch it again)
  if (page.cover) {
    frontMatter.featuredImage =
      page.cover.type === "external"
        ? page.cover.external.url
        : pageIdToApiUrl(page.id);
  }

  // map page properties to front matter
  // Values come straight from the page object returned by the query,
  // no extra API calls!
  for (const property in page.properties) {
    if (!isAllowed(folder, property)) continue;
    const prop = page.properties[property];
    switch (prop.type) {
      case "checkbox":
        frontMatter[property] = prop.checkbox;
        break;
      case "select":
        if (prop.select) frontMatter[property] = prop.select.name;
        break;
      case "multi_select":
        frontMatter[property] = prop.multi_select.map((o) => o.name);
        break;
      case "email":
        if (prop.email) frontMatter[property] = prop.email;
        break;
      case "url":
        if (prop.url) frontMatter[property] = prop.url;
        break;
      case "date":
        if (prop.date) frontMatter[property] = prop.date.start;
        break;
      case "number":
        if (prop.number !== null) frontMatter[property] = prop.number;
        break;
      case "phone_number":
        if (prop.phone_number) frontMatter[property] = prop.phone_number;
        break;
      case "status":
        if (prop.status) frontMatter[property] = prop.status.name;
        break;
      case "files":
        frontMatter[property] = prop.files.map((f, i) =>
          imageWebPath(folder, page.id, f.name, i),
        );
        break;
      case "rich_text": {
        const text = prop.rich_text.map((t) => t.plain_text).join("");
        if (text) frontMatter[property] = text;
        break;
      }
      case "people":
        frontMatter[property] = prop.people
          .map((p) => ("name" in p ? p.name : null))
          .filter((n): n is string => !!n);
        break;
      // title, relation, rollup, formula, created/edited metadata: ignored
      default:
        break;
    }
  }

  // set default author (skipped for restricted folders)
  if (!restricted && frontMatter.authors == null) {
    try {
      const response = await notion.users.retrieve({
        user_id: page.last_edited_by.id,
      });
      if (response.name) {
        frontMatter.authors = [response.name];
      }
    } catch (error) {
      console.warn(`[Warning] Failed to get author name for ${page.id}`);
    }
  }

  // save metadata
  // Restricted folders keep only what the sync needs to detect changes,
  // so no hidden column values end up in the file.
  frontMatter.NOTION_METADATA = restricted
    ? { id: page.id, last_edited_time: page.last_edited_time }
    : page;
  frontMatter.MANAGED_BY_NOTION_HUGO = true;

  return {
    title,
    pageString:
      "---\n" +
      YAML.stringify(frontMatter, {
        defaultStringType: "QUOTE_DOUBLE",
        defaultKeyType: "PLAIN",
      }) +
      "\n---\n" +
      frontInjectString +
      "\n" +
      mdString,
  };
}

async function downloadImages(page: PageObjectResponse, folder: string) {
  const perPage = PER_PAGE_IMAGES.includes(folder);
  for (const property in page.properties) {
    if (!isAllowed(folder, property)) continue;
    const prop = page.properties[property];
    if (prop.type !== "files") continue;

    for (const [i, file] of prop.files.entries()) {
      const url = file.type === "file" ? file.file.url : file.external.url;
      const outputPath = path.join(
        "static",
        imageWebPath(folder, page.id, file.name, i),
      );

      await fs.ensureDir(path.dirname(outputPath));

      // per-person photos are refreshed whenever the row changes,
      // so a new photo in Notion replaces the old one
      if (perPage || !fs.existsSync(outputPath)) {
        console.log(`[Info] Downloading image: ${outputPath}`);
        await downloadFile(url, outputPath);
      }
    }
  }
}

export async function savePage(
  page: PageObjectResponse,
  notion: Client,
  mount: DatabaseMount | PageMount,
) {
  const postpath = path.join(
    "content",
    mount.target_folder,
    getFileName(getPageTitle(page), page.id),
  );
  const post = getContentFile(postpath);
  if (post && post.metadata.last_edited_time === page.last_edited_time) {
    console.info(`[Info] The post ${postpath} is up-to-date, skipped.`);
    return;
  }
  // otherwise update the page
  console.info(`[Info] Updating ${postpath}`);

  await downloadImages(page, mount.target_folder);

  const { title, pageString } = await renderPage(
    page,
    notion,
    mount.target_folder,
  );
  const fileName = getFileName(title, page.id);
  fs.ensureDirSync(`content/${mount.target_folder}`);
  fs.writeFileSync(`content/${mount.target_folder}/${fileName}`, pageString);
}