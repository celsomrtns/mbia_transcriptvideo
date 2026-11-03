const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const videoPath = path.join(__dirname, "video", "video.mp4");
const pagePath = path.join(__dirname, "index.html");

function sendFile(req, res, filePath, contentType) {
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Arquivo não encontrado.");
      return;
    }

    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        res.end();
        return;
      }

      let start = match[1] ? Number(match[1]) : null;
      let end = match[2] ? Number(match[2]) : null;
      if (start === null) {
        const suffixLength = end;
        if (!suffixLength) {
          res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
          res.end();
          return;
        }
        start = Math.max(stats.size - suffixLength, 0);
        end = stats.size - 1;
      } else {
        end = end === null ? stats.size - 1 : Math.min(end, stats.size - 1);
      }

      if (start >= stats.size || end < start) {
        res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        res.end();
        return;
      }

      res.writeHead(206, {
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Content-Type": contentType,
      });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Content-Length": stats.size,
      "Content-Type": contentType,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
}

function sendAudio(res) {
  execFile(
    "ffmpeg",
    [
      "-nostdin",
      "-v",
      "error",
      "-i",
      videoPath,
      "-map",
      "0:a:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-f",
      "f32le",
      "pipe:1",
    ],
    { encoding: "buffer", maxBuffer: 128 * 1024 * 1024 },
    (error, audio, stderr) => {
      if (error) {
        const message =
          error.code === "ENOENT"
            ? "FFmpeg não encontrado. Instale o FFmpeg e inclua-o no PATH."
            : stderr.toString().trim() || error.message;
        console.error(`Falha ao extrair o áudio: ${message}`);
        res.writeHead(error.code === "ENOENT" ? 503 : 500, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        res.end(message);
        return;
      }

      if (!audio.length || audio.length % Float32Array.BYTES_PER_ELEMENT !== 0) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("O FFmpeg não retornou áudio válido para transcrição.");
        return;
      }

      res.writeHead(200, {
        "Content-Length": audio.length,
        "Content-Type": "application/octet-stream",
        "X-Audio-Sample-Rate": "16000",
      });
      res.end(audio);
    },
  );
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }

  const pathname = new URL(req.url, `http://${host}`).pathname;
  if (pathname === "/") {
    sendFile(req, res, pagePath, "text/html; charset=utf-8");
  } else if (pathname === "/video") {
    sendFile(req, res, videoPath, "video/mp4");
  } else if (pathname === "/audio" && req.method === "GET") {
    sendAudio(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Não encontrado.");
  }
});

server.on("error", (error) => {
  console.error(`Não foi possível iniciar o servidor: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Aplicação disponível em http://${host}:${port}`);
  console.log("Pressione Ctrl+C para encerrar.");
});
