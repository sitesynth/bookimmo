export const config = { matcher: '/plan/:path*' }

const COOKIE_NAME = 'bookimmo_plan'

function getCookie(req, name) {
  const header = req.headers.get('cookie') || ''
  const match = header.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

export default function middleware(req) {
  const password = process.env.PLAN_PASSWORD || 'bookimmo2026'
  const cookie = getCookie(req, COOKIE_NAME)
  if (cookie === password) return

  const url = new URL(req.url)
  const showError = url.searchParams.get('err') === '1'
  return new Response(gateHtml(url.pathname, showError), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

function gateHtml(redirectTo, showError) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>book.immo — доступ</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Inter:wght@400;500;600&display=swap">
<style>
  :root{--bg:#f5f2ea;--ink:#191a20;--mid:rgba(25,26,32,.62);--coral:#ff6625;--card:#fff8f4;--line:rgba(25,26,32,.12)}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--ink)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:0 24px 64px rgba(25,26,32,.1);padding:40px 36px;width:100%;max-width:360px}
  .word{font-family:'Bricolage Grotesque',Georgia,serif;font-size:22px;font-weight:700;margin-bottom:4px}
  .word .dot{color:var(--coral)}
  p{font-size:13.5px;color:var(--mid);margin:0 0 22px;line-height:1.5}
  input{width:100%;border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:15px;font-family:inherit;background:#fff;color:var(--ink);margin-bottom:6px}
  input:focus{outline:2px solid var(--coral);outline-offset:1px}
  .err{color:#c0392b;font-size:12.5px;margin:2px 0 14px;${showError ? '' : 'display:none;'}}
  button{width:100%;border:none;border-radius:10px;padding:12px 14px;margin-top:12px;background:var(--ink);color:#f5f2ea;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s}
  button:hover{background:var(--coral)}
</style>
</head>
<body>
<form class="card" method="POST" action="/api/plan-auth">
  <div class="word">book<span class="dot">.</span>immo</div>
  <p>Приватный раздел — введите пароль для доступа</p>
  <input type="hidden" name="redirect" value="${redirectTo}">
  <input type="password" name="password" placeholder="Пароль" autofocus>
  <div class="err">Неверный пароль, попробуйте ещё раз</div>
  <button type="submit">Войти</button>
</form>
</body>
</html>`
}
