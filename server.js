const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.use(
  express.static(publicDir, {
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
  })
);

app.get("/healthz", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "seowootype",
    uptime: Math.round(process.uptime()),
    checkedAt: new Date().toISOString()
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SeowooType is running at http://localhost:${PORT}`);
});
