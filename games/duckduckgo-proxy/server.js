const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { responseInterceptor } = require("http-proxy-middleware");

const app = express();
app.set("view engine", "ejs");

// Homepage → simple DuckDuckGo-style search box
app.get("/", (req, res) => {
  res.send(`
    <form action="/search" method="get">
      <input type="text" name="q" placeholder="Search DuckDuckGo..." />
      <button type="submit">Search</button>
    </form>
  `);
});

// Redirect /search?q=... → DuckDuckGo
app.get("/search", (req, res) => {
  const q = req.query.q || "";
  res.redirect(`/proxy/?q=${encodeURIComponent(q)}`);
});

// Proxy everything to DuckDuckGo
app.use(
  "/proxy",
  createProxyMiddleware({
    target: "https://duckduckgo.com",
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: (path, req) => path.replace(/^\/proxy/, ""), // strip "/proxy"
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const contentType = proxyRes.headers["content-type"];
      if (contentType && contentType.includes("text/html")) {
        let body = responseBuffer.toString("utf8");

        // Rewrite ALL links (DuckDuckGo results and internal)
        body = body.replace(/href="(.*?)"/g, (match, p1) => {
          if (p1.startsWith("http")) {
            return `href="/proxy?url=${encodeURIComponent(p1)}"`;
          } else if (p1.startsWith("/")) {
            return `href="/proxy${p1}"`;
          }
          return match;
        });

        body = body.replace(/src="(.*?)"/g, (match, p1) => {
          if (p1.startsWith("http")) {
            return `src="/proxy?url=${encodeURIComponent(p1)}"`;
          } else if (p1.startsWith("/")) {
            return `src="/proxy${p1}"`;
          }
          return match;
        });

        return body;
      }
      return responseBuffer;
    }),
  })
);

app.listen(3000, () => {
  console.log("🚀 DuckDuckGo Proxy at http://localhost:3000");
});
