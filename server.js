
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Identitas addon BitChord
app.get("/manifest.json", (req, res) => {
  res.json({
    id: "dev.universalmusic.bitchord",
    name: "Universal Music",
    version: "1.0.0",
    resources: ["search", "stream"],
    allowDownloads: 0
  });
});

// Pencarian katalog Deezer
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.json({ tracks: [] });
    }

    const response = await fetch(
      `https://api.deezer.com/search/track?q=${encodeURIComponent(q)}`
    );

    const data = await response.json();

    if (!data.data) {
      return res.json({ tracks: [] });
    }

    const tracks = data.data
      .filter(track => track.preview)
      .map(track => ({
        id: `deezer_${track.id}`,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        duration: track.duration,
        artworkURL: track.album.cover_xl,
        format: "mp3",
        audioQuality: "PREVIEW"
      }));

    res.json({ tracks });

  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({
      error: "Music search unavailable"
    });
  }
});

// Pemutaran preview musik
app.get("/stream/:id", async (req, res) => {
  try {
    const id = req.params.id.replace("deezer_", "");

    if (!/^\d+$/.test(id)) {
      return res.status(404).json({
        error: "Track not found"
      });
    }

    const response = await fetch(
      `https://api.deezer.com/track/${id}`
    );

    const track = await response.json();

    if (!track.preview) {
      return res.status(404).json({
        error: "Preview unavailable"
      });
    }

    res.json({
      url: track.preview,
      format: "mp3",
      codec: "mp3",
      container: "mp3",
      manifest: "none",
      encrypted: false,
      quality: "Deezer Preview"
    });

  } catch (error) {
    console.error("Stream error:", error.message);
    res.status(500).json({
      error: "Stream unavailable"
    });
  }
});

// Pemeriksaan server
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    addon: "Universal Music"
  });
});

app.listen(PORT, () => {
  console.log(`Universal Music running on port ${PORT}`);
});
