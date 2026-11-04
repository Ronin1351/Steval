export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET required' });
  }
  const raw = req.query?.ticker;
  const ticker = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(ticker)) {
    return res.status(400).json({ error: 'Valid ticker required' });
  }
  const url = `https://valueinvesting.io/${encodeURIComponent(ticker)}/valuation/wacc`;
  try {
    const upstream = await fetch(url, {
      headers: { 'Accept': 'text/html', 'User-Agent': 'Steval/1.0' },
      redirect: 'error',
      signal: AbortSignal.timeout(8000)
    });
    if (!upstream.ok) return res.status(upstream.status === 404 ? 404 : 503).json({ error: 'WACC unavailable' });
    if (!upstream.headers.get('content-type')?.includes('text/html')) {
      return res.status(502).json({ error: 'WACC unavailable' });
    }
    const html = await upstream.text();
    if (html.length > 2_000_000) return res.status(502).json({ error: 'WACC unavailable' });

    // Only the selected value in company-specific description metadata is accepted.
    // Other percentages on the page may be cost of equity, cost of debt or ranges.
    const escapedTicker = ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const selected = new RegExp(`^The WACC of [^<>\\r\\n]{1,250}\\(${escapedTicker}\\) is (\\d+(?:\\.\\d+)?)%\\.(?:\\s|$)`, 'i');
    let wacc = null;
    for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
      const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
        .map(match => [match[1].toLowerCase(), match[2] ?? match[3]]));
      if ((attrs.name || '').toLowerCase() !== 'description') continue;
      const match = selected.exec(attrs.content || '');
      if (match) wacc = Number(match[1]);
      break;
    }
    if (!Number.isFinite(wacc) || wacc < 0 || wacc > 100) {
      return res.status(502).json({ error: 'WACC unavailable' });
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=21600');
    return res.status(200).json({ ticker, wacc, source: 'ValueInvesting.io', url, retrievedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(error.name === 'TimeoutError' || error.name === 'AbortError' ? 504 : 503).json({ error: 'WACC unavailable' });
  }
}
