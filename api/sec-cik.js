// GET /api/sec-cik?ticker=PLTR
const UA = process.env.SEC_UA || "StockEvaluator/1.0 (contact: your-email@example.com)";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { ticker } = req.query || {};
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  try {
    const r = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": UA, "Accept": "application/json" },
    });
    if (!r.ok) return res.status(r.status).json({ error: "sec list fetch failed" });
    const data = await r.json(); // {0:{cik_str, ticker, title}, 1:{...}, ...}

    const want = String(ticker).trim().toUpperCase();
    let cik = null;
    for (const k in data) {
      if (data[k].ticker === want) { cik = data[k].cik_str; break; }
    }
    if (!cik) return res.status(404).json({ error: "CIK not found" });
    const cik10 = String(cik).padStart(10, "0");
    return res.status(200).json({ cik: cik10 });
  } catch (e) {
    return res.status(500).json({ error: "server error", detail: String(e) });
  }
};
