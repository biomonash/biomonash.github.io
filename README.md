# BiOM Website

This repository contains the BiOM website. The site is built with Hugo and uses Notion as its content management system (CMS). Content is pulled from the connected BiOM Notion database and converted into pages that Hugo can display.

## How to run the website

### Prerequisites

Before running the project, install:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Hugo](https://gohugo.io/installation/)

You will also need access to:

- The BiOM Notion workspace and connected content database
- The project's `NOTION_TOKEN', can be obtained by a project manager

### Clone and run locally

Clone the repository

Install the Node.js dependencies:

```bash
npm install
```

Create a file named `.env` in the root directory and add:

```env
NOTION_TOKEN=
```

Ask a project manager for the value of `NOTION_TOKEN` and add it after the equals sign.

> **Important:** Never commit the `.env` file or the Notion token to GitHub.

Pull the latest content from Notion:

```bash
npm start
```

Start the local Hugo development server:

```bash
hugo server
```

Open the local address shown in the terminal. This will usually be:

```text
http://localhost:1313/
```

## Project structure

The main directories and files are:

- `assets/` — source files processed by Hugo, such as CSS and JavaScript
- `content/` — website content generated from or associated with Notion
- `layouts/` — Hugo HTML templates that control how pages are displayed
- `static/` — files copied directly into the generated website, including images
- `config/_default/config.toml` — general Hugo configuration
- `notion-hugo.config.ts` — Notion connection and content sync configuration
- `.github/workflows/` — automated content sync and deployment workflows
- `public/` — generated website output created by Hugo

Avoid manually editing files inside `public/`, as Hugo regenerates this directory when the site is built.

## URLs and `relURL`

Use Hugo's `relURL` function when linking to internal pages or static assets:

```go-html-template
{{ "images/example.webp" | relURL }}
```
For example, in `index.html` which is located in `layouts/index.html` it needs to access `images/penguin.webp`, for hugo to access this file it must access the `/images` folder from the `/static` folder, to do this you must type `src="{{"images/penguin.webp" | relURL}}"` instead of `src="images/penguin.webp"` as Hugo will treat `/static` as the root of the project when the website is generated.

## Notion integration

The website reads content using an internal Notion integration.

The integration must:

- Have permission to read content
- Be connected to the relevant BiOM Notion page or database
- Have access to the page configured in `notion-hugo.config.ts`

The required secret is:

- `NOTION_TOKEN`

Only the secret name is documented here. The token itself must not be committed to the repository or included in this README. Ask a project manager for access if you need to run a Notion sync locally.

If the website cannot retrieve content from Notion, check that:

1. `NOTION_TOKEN` is present in the local `.env` file.
2. The Notion integration is connected to the BiOM page or database.
3. The correct Notion page is configured in `notion-hugo.config.ts`.

## Configuration

The main project configuration is stored in:

- `notion-hugo.config.ts` — configures the Notion source page and Notion to Hugo sync
- `config/_default/config.toml` — contains the Hugo website configuration
