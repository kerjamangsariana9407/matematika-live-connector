
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { TikTokLiveConnection } = require("tiktok-live-connector");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("Matematika LIVE Connector berjalan.");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log("Game terhubung:", socket.id);
});

let tiktok;
let username = "";

app.get("/connect", async (req, res) => {
  const user = String(req.query.username || "")
    .replace(/^@/, "")
    .trim();

  if (!user) {
    return res.status(400).send("Tambahkan username TikTok.");
  }

  try {
    if (tiktok) {
      try {
        await tiktok.disconnect();
      } catch (_) {}
    }

    username = user;
    tiktok = new TikTokLiveConnection(username);

    tiktok.on("chat", (data) => {
      const comment = String(data.comment || "").trim().toUpperCase();
      const nickname = String(
        data.nickname || data.uniqueId || "Pemain"
      );

      if (!["A", "B", "C", "D"].includes(comment)) return;

      io.emit("answer", {
        username: nickname,
        answer: comment
      });

      console.log("Jawaban:", nickname, comment);
    });

    await tiktok.connect();

    res.send("Permintaan koneksi TikTok LIVE berhasil dikirim untuk @" + username);
  } catch (error) {
    console.error(error);
    res.status(500).send("Gagal tersambung. Pastikan akun sedang LIVE dan periksa log layanan.");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server berjalan pada port", PORT);
});
