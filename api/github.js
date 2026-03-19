/**
 * Vercel Serverless Function: /api/github
 * ─────────────────────────────────────────
 * Proxies GitHub Contents API calls so the
 * GITHUB_TOKEN never appears in client-side code.
 *
 * Deploy steps:
 *  1. Add GITHUB_TOKEN to Vercel Environment Variables
 *     (Settings → Environment Variables)
 *  2. Add GITHUB_REPO to Vercel Environment Variables
 *     e.g. "your-github-username/fob-cert-store"
 *  3. This file must live at /api/github.js in your
 *     Vercel project root.
 *
 * Usage (from client):
 *   GET  /api/github?path=submissions/m3_submissions.json
 *   PUT  /api/github?path=certs/m3_certificates.json  (body = GitHub Contents API body)
 */

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO; // e.g. "username/fob-cert-store"

  if (!token || !repo) {
    return res.status(500).json({ error: 'Server misconfiguration: GITHUB_TOKEN or GITHUB_REPO not set' });
  }

  const ghUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'fobexams-m3-portal',
  };

  try {
    const ghRes = await fetch(ghUrl, {
      method: req.method,
      headers,
      ...(req.method === 'PUT' ? { body: JSON.stringify(req.body) } : {}),
    });

    const data = await ghRes.json();

    // Forward GitHub's status code
    res.status(ghRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'GitHub proxy error: ' + err.message });
  }
}
