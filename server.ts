import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Store active menus and orders in memory (for demo purposes, real app would use DB)
  const menus = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Chef joins their own room to receive orders
    socket.on("register-chef", (chefId) => {
      socket.join(`chef-${chefId}`);
      console.log(`Chef registered: ${chefId}`);
    });

    // Guest sends an order to a chef
    socket.on("send-order", ({ chefId, order }) => {
      console.log(`Order received for chef ${chefId}:`, order);
      io.to(`chef-${chefId}`).emit("new-order", order);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API to get a chef's menu (simulated)
  app.get("/api/menu/:chefId", (req, res) => {
    const menu = menus.get(req.params.chefId);
    if (menu) {
      res.json(menu);
    } else {
      res.status(404).json({ error: "Menu not found" });
    }
  });

  // API to save a chef's menu
  app.post("/api/menu/:chefId", express.json(), (req, res) => {
    menus.set(req.params.chefId, req.body);
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  return app;
}

export default startServer();
