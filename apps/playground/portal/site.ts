import type { Plugin } from "vite";
import { fileURLToPath } from "node:url";
import { escapeHtml, pages, repository } from "./content";

const root = new URL("../", import.meta.url);
const routes = Object.keys(pages);

export const inputs = Object.fromEntries(
  routes.map((route) => [
    route || "home",
    fileURLToPath(new URL(`${route ? route + "/" : ""}index.html`, root)),
  ]),
);

export function portal(origin: string | undefined): Plugin {
  const base = origin
    ? new URL(origin.endsWith("/") ? origin : origin + "/")
    : null;
  if (
    base &&
    (!["http:", "https:"].includes(base.protocol) ||
      base.search ||
      base.hash ||
      base.username ||
      base.password)
  ) {
    throw new Error(
      "GVE_SITE_URL must be an HTTP(S) URL with an optional path prefix.",
    );
  }

  const urlFor = (route: string) =>
    `${base?.href ?? ""}${route ? route + "/" : ""}`;

  return {
    name: "gve-static-portal",
    transformIndexHtml: {
      order: "pre",
      handler(html, { filename }) {
        const route = routes.find(
          (route) => inputs[route || "home"] === filename,
        );
        if (route === undefined) return html;
        const page = pages[route];
        const prefix = route ? "../" : "./";
        const skip = route === "playground" ? "visualization" : "content";

        return html
          .replace(
            "<!-- portal:head -->",
            `
          <title>${page.title}</title>
          <meta name="description" content="${escapeHtml(page.description)}">
          <meta property="og:type" content="website">
          <meta property="og:title" content="${page.title}">
          <meta property="og:description" content="${escapeHtml(page.description)}">
          ${base ? `<link rel="canonical" href="${escapeHtml(urlFor(route))}"><meta property="og:url" content="${escapeHtml(urlFor(route))}">` : ""}
        `,
          )
          .replace(
            "<!-- portal:body -->",
            () => `
          <a class="skip-link" href="#${route === "playground" ? "visualizer" : "content"}">Skip to ${skip}</a>
          <header class="site-header"><div class="wrap masthead">
            <a class="brand" href="${prefix}"><span aria-hidden="true"><i></i><i></i><i></i></span> GVE</a>
            <nav aria-label="Primary">${routes
              .filter(Boolean)
              .map(
                (id) =>
                  `<a href="${prefix}${id}/"${id === route ? ' aria-current="page"' : ""}>${pages[id].label}</a>`,
              )
              .join("")}</nav>
            <label class="theme" for="theme">Theme <select id="theme"><option value="auto">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          </div></header>
          ${page.body}
          <footer class="site-footer"><div class="wrap footer-row"><p>GVE · MIT License</p><nav aria-label="Project links"><a href="${repository}">GitHub</a><a href="https://www.npmjs.com/org/gvejs">npm</a></nav></div></footer>
          <script type="module" src="/src/portal.ts"></script>
          ${page.script ? `<script type="module" src="/src/${page.script}"></script>` : ""}
        `,
          );
      },
    },
    generateBundle() {
      if (!base) return;
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          routes
            .map(
              (route) => `  <url><loc>${escapeHtml(urlFor(route))}</loc></url>`,
            )
            .join("\n") +
          "\n</urlset>\n",
      });
    },
  };
}
