import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../common/public.decorator';
import { ApiUsageService } from './api-usage.service';
import { ApiUsageAuthGuard } from './api-usage-auth.guard';

@Public()
@Controller('apiusage')
export class ApiUsageController {
  constructor(private readonly apiUsageService: ApiUsageService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: { email?: string; password?: string }) {
    return this.apiUsageService.login(body.email || '', body.password || '');
  }

  @Get()
  async ui(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(this.renderPage());
  }

  @Get('health')
  @UseGuards(ApiUsageAuthGuard)
  async health() {
    const docs = await this.apiUsageService.getAll();
    return {
      checkedAt: new Date().toISOString(),
      summary: await this.apiUsageService.summary(docs),
      apis: docs,
    };
  }

  @Post('refresh')
  @UseGuards(ApiUsageAuthGuard)
  async refresh() {
    const docs = await this.apiUsageService.refresh();
    return {
      checkedAt: new Date().toISOString(),
      summary: await this.apiUsageService.summary(docs),
      apis: docs,
    };
  }

  @Get('healthy')
  @UseGuards(ApiUsageAuthGuard)
  async healthy(@Query('provider') provider?: string, @Query('pool') pool?: string) {
    const docs = await this.apiUsageService.getHealthy(provider, pool);
    return {
      checkedAt: new Date().toISOString(),
      apis: docs,
    };
  }

  private renderPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>API Usage Monitor</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  .sub { color: #94a3b8; margin: 0 0 24px; font-size: 14px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .summary { display: flex; gap: 12px; flex-wrap: wrap; }
  .pill { padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  .pill.healthy { background: #052e16; color: #4ade80; border: 1px solid #166534; }
  .pill.exhausted { background: #451a03; color: #fb923c; border: 1px solid #9a3412; }
  .pill.invalid { background: #450a0a; color: #f87171; border: 1px solid #991b1b; }
  .pill.unknown { background: #1e293b; color: #94a3b8; border: 1px solid #475569; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; font-size: 14px; vertical-align: top; }
  th { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: .05em; }
  .status { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .status.healthy { background: #052e16; color: #4ade80; }
  .status.exhausted { background: #451a03; color: #fb923c; }
  .status.invalid { background: #450a0a; color: #f87171; }
  .status.unknown { background: #334155; color: #cbd5e1; }
  .err { color: #f87171; font-size: 12px; word-break: break-all; }
  .actions { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
  button { background: #3b82f6; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
  button:hover { background: #2563eb; }
  button.secondary { background: #334155; }
  button.secondary:hover { background: #475569; }
  input { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 14px; width: 100%; }
  label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
  .field { margin-bottom: 14px; }
  .error { color: #f87171; font-size: 13px; margin-top: 10px; }
  .hidden { display: none; }
  .updated { color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <h1>API Usage Monitor</h1>
  <p class="sub">Live status of the LLM API keys used by internal services.</p>

  <div id="loginCard" class="card">
    <h2 style="margin-top:0;font-size:18px;">Sign in</h2>
    <form id="loginForm">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" type="password" autocomplete="current-password" required />
      </div>
      <button type="submit">Sign in</button>
      <div id="loginError" class="error"></div>
    </form>
  </div>

  <div id="dashCard" class="card hidden">
    <div class="actions">
      <button id="refreshBtn">Refresh status</button>
      <button id="logoutBtn" class="secondary">Sign out</button>
    </div>
    <div id="summary" class="summary" style="margin-bottom:16px;"></div>
    <div id="updated" class="updated"></div>
  </div>

  <div id="tableCard" class="card hidden">
    <table>
      <thead>
        <tr><th>Provider</th><th>Key</th><th>Model</th><th>Status</th><th>Last checked</th><th>Details</th></tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </div>
</div>

<script>
(function () {
  const TOKEN_KEY = 'apisage_token';
  const loginCard = document.getElementById('loginCard');
  const dashCard = document.getElementById('dashCard');
  const tableCard = document.getElementById('tableCard');

  function token() { return localStorage.getItem(TOKEN_KEY); }
  function showLogin() {
    loginCard.classList.remove('hidden');
    dashCard.classList.add('hidden');
    tableCard.classList.add('hidden');
  }

  async function api(path, opts) {
    const headers = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(path, { ...opts, headers });
    if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); showLogin(); throw new Error('Session expired'); }
    if (!res.ok) throw new Error((await res.text()) || 'Request failed');
    return res.json();
  }

  function pill(status) { return '<span class="status ' + status + '">' + status + '</span>'; }

  function render(data) {
    const s = data.summary;
    document.getElementById('summary').innerHTML =
      '<span class="pill healthy">Healthy: ' + s.healthy + '</span>' +
      '<span class="pill exhausted">Exhausted: ' + s.exhausted + '</span>' +
      '<span class="pill invalid">Invalid: ' + s.invalid + '</span>' +
      '<span class="pill unknown">Unknown: ' + s.unknown + '</span>';
    document.getElementById('updated').textContent = 'Checked at ' + new Date(data.checkedAt).toLocaleString();
    document.getElementById('rows').innerHTML = (data.apis || []).map(function (a) {
      const checked = a.lastChecked ? new Date(a.lastChecked).toLocaleString() : '—';
      return '<tr>' +
        '<td>' + (a.provider || '—') + (a.pool ? ' (' + a.pool + ')' : '') + '</td>' +
        '<td>' + a.label + '<br><span class="err">' + a.keyMasked + '</span></td>' +
        '<td>' + (a.apiModel || '—') + '</td>' +
        '<td>' + pill(a.status) + '</td>' +
        '<td>' + checked + '</td>' +
        '<td>' + (a.error ? '<span class="err">' + a.error + '</span>' : (a.resetsAt ? 'Resets: ' + new Date(a.resetsAt).toLocaleString() : 'OK')) + '</td>' +
        '</tr>';
    }).join('');
    loginCard.classList.add('hidden');
    dashCard.classList.remove('hidden');
    tableCard.classList.remove('hidden');
  }

  async function load() {
    try { render(await api('/apiusage/health', { method: 'GET' })); }
    catch (e) { if (token()) document.getElementById('loginError').textContent = e.message; }
  }

  document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    document.getElementById('loginError').textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await fetch('/apiusage/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!data.ok) { document.getElementById('loginError').textContent = 'Invalid credentials'; return; }
      const body = await data.json();
      localStorage.setItem(TOKEN_KEY, body.token);
      await load();
    } catch (err) { document.getElementById('loginError').textContent = err.message; }
  });

  document.getElementById('refreshBtn').addEventListener('click', async function () {
    try { render(await api('/apiusage/refresh', { method: 'POST' })); }
    catch (e) { document.getElementById('loginError').textContent = e.message; }
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
  });

  if (token()) load(); else showLogin();
})();
</script>
</body>
</html>`;
  }
}