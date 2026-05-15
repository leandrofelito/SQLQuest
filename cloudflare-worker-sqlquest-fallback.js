const ORIGIN_HOST = 'origin.sqlquest.com.br'
const ORIGIN_TIMEOUT_MS = 8000

const MAINTENANCE_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SQLQuest em manutencao</title>
  <meta name="robots" content="noindex" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #080a0f;
      --panel: #10131b;
      --text: #f7f7fb;
      --muted: #a3a7b7;
      --accent: #a78bfa;
      --line: rgba(255, 255, 255, 0.1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.2), transparent 35%), var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }
    main {
      width: min(100%, 520px);
      border: 1px solid var(--line);
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      border-radius: 14px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0;
      margin-bottom: 22px;
    }
    .brand span:first-child { color: var(--accent); }
    .brand span:last-child { color: #facc15; }
    h1 {
      font-size: 28px;
      line-height: 1.2;
      margin: 0 0 12px;
    }
    p {
      margin: 0;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.6;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding: 9px 12px;
      border: 1px solid rgba(167, 139, 250, 0.28);
      border-radius: 999px;
      color: #ddd6fe;
      background: rgba(124, 58, 237, 0.12);
      font-size: 13px;
      font-weight: 700;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #facc15;
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.7);
    }
  </style>
</head>
<body>
  <main>
    <div class="brand"><span>SQL</span><span>Quest</span></div>
    <h1>Site e app em manutencao</h1>
    <p>Estamos realizando ajustes para melhorar sua experiencia. Tente novamente em alguns minutos.</p>
    <div class="status"><span class="dot"></span> Manutencao temporaria</div>
  </main>
</body>
</html>`

function maintenanceResponse() {
  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '300',
    },
  })
}

async function fetchWithTimeout(request) {
  const originalUrl = new URL(request.url)
  const originUrl = new URL(request.url)
  originUrl.hostname = ORIGIN_HOST

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ORIGIN_TIMEOUT_MS)

  try {
    const originRequest = new Request(originUrl.toString(), request)
    originRequest.headers.set('host', originalUrl.hostname)

    const response = await fetch(originRequest, {
      cf: { cacheTtl: 0, cacheEverything: false },
      signal: controller.signal,
    })

    if (response.status >= 500 && response.status !== 503) {
      return maintenanceResponse()
    }

    return response
  } finally {
    clearTimeout(timeout)
  }
}

export default {
  async fetch(request) {
    try {
      return await fetchWithTimeout(request)
    } catch {
      return maintenanceResponse()
    }
  },
}
