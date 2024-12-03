import db from "../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Explicitly select only the necessary fields
      const [logs] = await db.query(
        "SELECT id, image_url, filename, uploaded_at FROM logs ORDER BY uploaded_at DESC"
      );
      return res.status(200).json(logs);
    } catch (err) {
      console.error("Error fetching logs:", err.message);
      return res.status(500).json({ error: "Failed to fetch logs from the database" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
