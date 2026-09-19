# Home Theory — Claude Code Context

## What this project is
A Singapore property eligibility quiz and blog at hometheory.sg.
Helps SC/PR/foreigner buyers find out what they can buy (BTO/resale/EC/private)
and what grants they qualify for.

## Tech stack
- Astro + React (Quiz.jsx)
- Netlify hosting + Netlify Functions
- Airtable (lead storage, table "Leads")
- Resend (email notifications)
- Local dev: `netlify dev`

## Project structure
- src/pages/ — all pages (index.astro, quiz.astro, about.astro)
- src/pages/blog/ — blog list page
- src/layouts/BaseLayout.astro — shared layout (GA, header, footer)
- src/layouts/BlogPost.astro — blog article layout
- src/components/Quiz.jsx — full quiz logic
- src/components/eligibility.js — ALL eligibility rules, grants, ABSD
- src/content/blog/*.md — blog articles
- netlify/functions/ — submit-lead.js, request-agent.js

## Branding
- Colors: --ink #1C1A17, --clay #C5613A, cream #FAF7F2
- Font: Georgia serif for all headings
- Logo: text wordmark "Home Theory" (Theory in terracotta)

## Eligibility rules
- eligibility.js is the source of truth for all HDB rules
- Covers: SC/PR/foreigner, singles 35+, widowed/orphan 21+
- Grants: EHG, Family Grant, PHG, Singles Grant
- ABSD rates and SC Premium ($10k refundable) included
- Always verify rule changes at hdb.gov.sg before updating

## Blog articles
- Stored in src/content/blog/*.md
- Frontmatter needs: title, pubDate, description
- Images go in public/blog-images/<article-name>/
- Always end articles with a quiz CTA link to /quiz

## Deploy
- git push → triggers Netlify auto-deploy
- Never commit .env file
- Environment variables live in Netlify dashboard

## Common tasks
- New article: create .md file in src/content/blog/
- Rule change: update src/components/eligibility.js
- Style change: check BaseLayout.astro and relevant page
