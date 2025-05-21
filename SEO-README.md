# SEO Implementation Guide for Docubeam

This document provides an overview of the SEO implementation for the Docubeam application and instructions on how to maintain and update the SEO settings.

## Overview

The SEO implementation for Docubeam includes:

1. Meta tags for title, description, and Open Graph/Twitter cards
2. Structured data (JSON-LD) for better search engine understanding
3. Sitemap.xml for search engine crawling
4. Robots.txt for crawler instructions
5. Canonical URLs to prevent duplicate content issues

All SEO metadata is directly included in the `index.html` file for optimal performance and to ensure search engines can access the metadata immediately without waiting for JavaScript to execute.

## SEO Components

### Meta Tags

The meta tags in `index.html` include:

- Primary meta tags (title, description, keywords)
- Open Graph / Facebook meta tags for social sharing
- Twitter meta tags for Twitter cards
- Canonical URL

### Structured Data

The structured data in `index.html` includes JSON-LD markup for:

- Website information
- Software application details
- Organization information

## How to Update SEO Settings

### Updating Meta Tags

To update the meta tags, modify the corresponding tags in the `<head>` section of `index.html`:

```html
<!-- Primary Meta Tags -->
<title>Docubeam - Extract PDF Comments & Get Actionable Insights</title>
<meta name="title" content="Docubeam - Extract PDF Comments & Get Actionable Insights">
<meta name="description" content="Docubeam extracts and organizes comments from PDF documents, providing actionable insights and centralized data organization." />
<meta name="keywords" content="PDF comments, document management, PDF extraction, comment organization, document insights, PDF annotations" />
```

### Updating Open Graph / Facebook Tags

To update the Open Graph / Facebook tags, modify the corresponding tags in the `<head>` section of `index.html`:

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://docubeam.websyte.ai/" />
<meta property="og:title" content="Docubeam - Extract PDF Comments & Get Actionable Insights" />
<meta property="og:description" content="Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." />
<meta property="og:image" content="/docubeam-og.png" />
<meta property="og:site_name" content="Docubeam" />
```

### Updating Twitter Tags

To update the Twitter tags, modify the corresponding tags in the `<head>` section of `index.html`:

```html
<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://docubeam.websyte.ai/" />
<meta name="twitter:title" content="Docubeam - Extract PDF Comments & Get Actionable Insights" />
<meta name="twitter:description" content="Stop chasing comments and get actionable insights from your PDF documents. Docubeam extracts, organizes, and analyzes comments for better decision-making." />
<meta name="twitter:image" content="/docubeam-og.png" />
<meta name="twitter:creator" content="@docubeam" />
```

### Updating Structured Data

To update the structured data, modify the corresponding JSON-LD scripts in the `<head>` section of `index.html`:

```html
<!-- Structured Data - Website -->
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://docubeam.websyte.ai/",
    "name": "Docubeam",
    "description": "Docubeam extracts and organizes comments from PDF documents, providing actionable insights and centralized data organization."
  }
</script>
```

### Updating the OG Image

The Open Graph image is used for social media sharing. To update it:

1. Create a new image file (1200x630 pixels recommended) and place it in the `public` folder
2. Update the `og:image` and `twitter:image` meta tags in `index.html`

### Updating the Sitemap

The sitemap.xml file helps search engines discover and index your pages. To update it:

1. Open `public/sitemap.xml`
2. Add, remove, or modify the `<url>` entries as needed
3. Update the `<lastmod>` dates when content changes

### Updating Robots.txt

The robots.txt file provides instructions to search engine crawlers. To update it:

1. Open `public/robots.txt`
2. Modify the rules as needed

## Best Practices

1. Keep page titles under 60 characters
2. Keep meta descriptions under 160 characters
3. Use descriptive, keyword-rich titles and descriptions
4. Use structured data where appropriate
5. Regularly update the sitemap when adding or removing pages
6. Use canonical URLs to prevent duplicate content issues
7. Test your SEO implementation using tools like Google's Structured Data Testing Tool and Facebook's Sharing Debugger

## TODO

- [x] Create a proper OG image for social media sharing
- [x] Add a proper logo for favicon and organization structured data
- [ ] Add more structured data types as needed (e.g., FAQ, Product)
- [ ] Implement dynamic sitemap generation
- [ ] Add analytics tracking
- [ ] Implement more advanced SEO features (breadcrumbs, etc.)
