// A small static server for the tests: the Employee Portal, with Model Studio
// under /studio/. Model Studio loads ES modules and
// WebAssembly, which browsers do not allow from file:// pages.
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../Employee Portal");
const port = +process.env.PORT || 4178;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".wasm": "application/wasm", ".json": "application/json", ".png": "image/png", ".step": "application/octet-stream" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => console.log("Model Studio on http://localhost:" + port + "/studio/"));
