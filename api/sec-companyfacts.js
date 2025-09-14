// api/sec-companyfacts.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  const UA = process.env.SEC_UA || 'BubbleHub-StockEval/1.0 (you@example.com)';
  let { cik, ticker } = req.query || {};

  try {
    // If ticker is provided, map to CIK on the server
    if (!cik && ticker) {
      const r = await fetch('https://www.sec.gov/files/company_tickers.json', {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' }
      });
      if (!r.ok) return res.status(r.status).json({ error: 'tickers fetch failed' });
      const data = await r.json();

      const want = String(ticker).trim().toUpperCase();
      for (const k in data) {
        if (data[k].ticker === want) { cik = data[k].cik_str; break; }
      }
      if (!cik) return res.status(404).json({ error: 'CIK not found' });
    }

    if (!cik) return res.status(400).json({ error: 'ticker or cik required' });

    const cik10 = String(cik).replace(/\D/g, '').padStart(10, '0'); // zero-pad
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10}.json`;

    const rf = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    const json = await rf.json();
    return res.status(rf.ok ? 200 : rf.status).json(json);
  } catch (e) {
    return res.status(500).json({ error: 'server error', detail: String(e) });
  }
}
