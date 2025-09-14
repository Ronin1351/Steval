// GET /api/sec-submissions?cik=0001321655
const UA = process.env.SEC_UA || "StockEvaluator/1.0 (contact: your-email@example.com)";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  let { cik } = req.query || {};
  if (!cik) return res.status(400).json({ error: "cik required" });
  cik = String(cik).replace(/\D/g, "").padStart(10, "0");

  try {
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
    if (!r.ok) return res.status(r.status).json({ error: "subs fetch failed" });
    const json = await r.json();
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: "server error", detail: String(e) });
  }
};
