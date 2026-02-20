import type { VercelRequest, VercelResponse } from '@vercel/node';

// Note: This is still in-memory and will reset on Vercel.
// For persistence, use a real database.
const menus = new Map();

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { chefId } = req.query;

  if (req.method === 'GET') {
    const menu = menus.get(chefId);
    if (menu) {
      return res.json(menu);
    }
    return res.status(404).json({ error: "Menu not found" });
  }

  if (req.method === 'POST') {
    menus.set(chefId, req.body);
    return res.json({ success: true });
  }

  res.status(405).end();
}
