import db from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const [logs] = await db.query("SELECT * FROM logs ORDER BY uploaded_at DESC");
      return res.status(200).json(logs);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
