---
name: firecrawl
description: Web scraping and crawling skill using Firecrawl MCP. Use ONLY when external web content needs to be collected, audited, or transformed. Do not use for internal project tasks. Triggers when asked to scrape a website, collect competitor data, audit external content, or crawl a web property.
license: MIT
metadata:
  author: Firecrawl / Mendable
  version: "1.0.0"
  source: github.com/firecrawl/firecrawl-mcp-server
---

# Firecrawl — Web Scraping & Crawling

MCP-powered web scraping and crawling for collecting, auditing, or transforming external web content.

## When to Apply

**Only use when you need to:**
- Scrape external websites for content
- Audit a competitor's pages or pricing
- Collect structured data from web properties
- Transform web content into structured formats
- Monitor external pages for changes

**Do NOT use for:**
- Internal project tasks
- Reading local files
- Accessing authenticated/private pages without permission
- Scraping personal data or bypassing bot protection

## Available Operations (via MCP)

Once the Firecrawl MCP is configured, these operations are available:

### `firecrawl_scrape`
Scrape a single URL and return clean markdown or structured data.

```
Scrape https://example.com/pricing and extract all pricing tiers as JSON.
```

### `firecrawl_crawl`
Crawl an entire domain, following internal links.

```
Crawl https://docs.example.com and collect all documentation pages.
```

### `firecrawl_map`
Get a sitemap of all URLs on a domain.

```
Map all URLs on https://example.com to understand the site structure.
```

### `firecrawl_search`
Search the web and return structured results.

```
Search for "React design system best practices 2026" and return top 5 results.
```

### `firecrawl_extract`
Extract structured data using a schema from one or multiple URLs.

```
Extract product name, price, and description from https://shop.example.com/product/123.
```

## MCP Configuration

The Firecrawl MCP is configured in `.claude/settings.json`. It requires a `FIRECRAWL_API_KEY`.

Get your API key at: https://www.firecrawl.dev/app/api-keys

### Local Configuration (already set up if key is provided):
```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "YOUR_FIRECRAWL_API_KEY"
      }
    }
  }
}
```

### Remote Configuration (simpler, no Node.js required):
```
claude mcp add firecrawl --url https://mcp.firecrawl.dev/YOUR_API_KEY/v2/mcp
```

## Usage Examples

### Collect competitor pricing
```
Use firecrawl to scrape https://competitor.com/pricing and extract all plan names, prices, and features as a comparison table.
```

### Audit documentation quality
```
Crawl https://docs.mycompany.com and find all pages with broken links or missing titles.
```

### Research aggregation
```
Search for "Next.js 15 performance optimization" and summarize the top 3 articles.
```

## Privacy & Ethics

- Only scrape publicly accessible pages
- Respect `robots.txt` directives
- Do not collect personal data (names, emails, phone numbers) from public pages
- Include appropriate delays between requests (Firecrawl handles this)
- Do not circumvent bot protection mechanisms
