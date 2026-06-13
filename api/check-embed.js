export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url" });
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid url" });
  }

  try {
    const response = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MythosphereBot/1.0)"
      }
    });

    const xfo = response.headers.get("x-frame-options") || "";
    const csp = response.headers.get("content-security-policy") || "";

    let embeddable = true;

    // X-Frame-Options blocks framing if DENY or SAMEORIGIN
    if (/deny|sameorigin/i.test(xfo)) {
      embeddable = false;
    }

    // CSP frame-ancestors directive
    const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
    if (frameAncestorsMatch) {
      const value = frameAncestorsMatch[1].trim().toLowerCase();
      if (value === "'none'" || value === "'self'") {
        embeddable = false;
      }
    }

    return res.status(200).json({
      embeddable,
      checkedUrl: target.toString(),
      status: response.status
    });
  } catch (err) {
    // If the fetch fails (timeout, network error, etc.) assume not embeddable
    return res.status(200).json({
      embeddable: false,
      error: err.message,
      checkedUrl: target.toString()
    });
  }
}
