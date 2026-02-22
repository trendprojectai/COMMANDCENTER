// server/index.js
// Express + WebSocket server for n8n → CommandCenter real-time integration.

import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
let prisma = null;
try {
  const mod = await import('./lib/prisma.js');
  prisma = await (mod.getPrisma?.() ?? Promise.resolve(mod.default));
  if (prisma) {
    console.log('[DB] Prisma connected');
  } else {
    const err = mod.getPrismaInitError?.();
    console.warn('[DB] Prisma unavailable — DB-backed routes will return 503:', err?.message ?? 'unknown error');
  }
} catch (e) {
  console.warn('[DB] Prisma unavailable — DB-backed routes will return 503:', e.message);
}

const PORT = process.env.PORT ?? 3001;
const N8N_API_URL = process.env.N8N_API_URL ?? '';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';

// In-memory VideoJob store — survives hot reloads
globalThis.__videoJobStore ??= new Map();
const videoJobStore = globalThis.__videoJobStore;

function dbRequired(res) {
  res.status(503).json({ error: 'Database not available' });
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const fs = await import('fs');
const path = await import('path');

// Burn-in stub: sets burnedVideoUrl = job.videoUrl (real FFmpeg wired later)
async function runBurnIn(job, caption) {
  if (!prisma) { console.warn('[burn-in] skipped — no DB'); return; }
  try {
    await prisma.videoCaption.update({
      where: { id: caption.id },
      data:  { burnStatus: 'done', burnedVideoUrl: job.videoUrl },
    });
    await prisma.videoJob.update({
      where: { id: job.id },
      data:  { status: 'READY_TO_PUSH' },
    });
    console.log('[burn-in] stub done for caption:', caption.id);
  } catch (err) {
    console.error('[burn-in] failed:', err.message);
    await prisma.videoCaption.update({ where: { id: caption.id }, data: { burnStatus: 'failed' } }).catch(() => {});
    await prisma.videoJob.update({ where: { id: job.id }, data: { status: 'FAILED' } }).catch(() => {});
  }
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();
let lastEvent = null;

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected (total: ${clients.size})`);

  if (lastEvent) {
    try {
      ws.send(JSON.stringify(lastEvent));
    } catch {
      // no-op
    }
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected (total: ${clients.size})`);
  });
});

function broadcast(data) {
  lastEvent = data;
  const msg = JSON.stringify(data);
  let sent = 0;
  clients.forEach((ws) => {
    if (ws.readyState === 1) {
      try {
        ws.send(msg);
        sent += 1;
      } catch {
        // no-op
      }
    }
  });
  console.log(`[WS] Broadcast "${data.event}" to ${sent} client(s):`, data.task_name);
}

// Simple task board persistence (tasks/TODO.md as markdown + JSON API)
const TASKS_DIR = path.resolve(process.cwd(), '..', 'tasks');
const TASKS_FILE = path.join(TASKS_DIR, 'TODO.md');
const TASKS_JSON = path.join(TASKS_DIR, 'tasks.json');

function ensureTasksDir() {
  try {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
  } catch (e) {
    // no-op
  }
}

function readTasks() {
  try {
    if (fs.existsSync(TASKS_JSON)) {
      const raw = fs.readFileSync(TASKS_JSON, 'utf8');
      return JSON.parse(raw);
    }
    return [];
  } catch (e) {
    return [];
  }
}

function writeTasks(tasks) {
  try {
    ensureTasksDir();
    fs.writeFileSync(TASKS_JSON, JSON.stringify(tasks, null, 2), 'utf8');
    // also update TODO.md for human editing
    const md = ['# Task Board (automated)\n'];
    tasks.forEach((t, i) => {
      md.push(`- ${t.title} — ${t.priority}  `);
      md.push(`  - ${t.description}  `);
      md.push(`  - created: ${new Date(t.created).toISOString()}  \n`);
    });
    fs.writeFileSync(TASKS_FILE, md.join('\n'), 'utf8');
  } catch (e) {
    console.error('Failed to write tasks', e);
  }
}

app.get('/api/tasks', (_req, res) => {
  const tasks = readTasks();
  res.json({ tasks });
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: 'title required' });
    return;
  }
  const tasks = readTasks();
  const task = { id: `t-${Date.now()}`, title, description: description ?? '', priority: priority ?? 'medium', created: Date.now(), status: 'open' };
  tasks.unshift(task);
  writeTasks(tasks);
  res.json({ ok: true, task });
});

app.post('/api/tasks/check', (_req, res) => {
  // simple flag file that the agent can poll or check
  ensureTasksDir();
  const flag = { checkedAt: Date.now() };
  try {
    fs.writeFileSync(path.join(TASKS_DIR, 'check-flag.json'), JSON.stringify(flag), 'utf8');
    res.json({ ok: true, checkedAt: flag.checkedAt });
  } catch (e) {
    res.status(500).json({ error: 'failed to write flag' });
  }
});

// Task status updates (start / progress / complete)
app.post('/api/tasks/:id/start', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  tasks[idx].status = 'in-progress';
  tasks[idx].progress = 0;
  writeTasks(tasks);
  broadcast({ event: 'task:update', task: tasks[idx] });
  res.json({ ok: true, task: tasks[idx] });
});

app.post('/api/tasks/:id/progress', (req, res) => {
  const { id } = req.params;
  const { progress } = req.body ?? {};
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  tasks[idx].progress = Number(progress) || 0;
  writeTasks(tasks);
  broadcast({ event: 'task:update', task: tasks[idx] });
  res.json({ ok: true, task: tasks[idx] });
});

app.post('/api/tasks/:id/complete', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  tasks[idx].status = 'complete';
  tasks[idx].progress = 100;
  tasks[idx].completed = Date.now();
  writeTasks(tasks);
  broadcast({ event: 'task:update', task: tasks[idx] });
  res.json({ ok: true, task: tasks[idx] });
});

function requireN8nConfig(res) {
  if (!N8N_API_URL || !N8N_API_KEY) {
    res.status(503).json({
      error: 'N8N is not configured. Set N8N_API_URL and N8N_API_KEY in .env',
    });
    return false;
  }
  return true;
}

async function n8nRequest(urlPath, init = {}) {
  return fetch(`${N8N_API_URL}${urlPath}`, {
    ...init,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Accept': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

const RANGE_POINTS = {
  '24h': 2,
  '7d': 7,
  '28d': 28,
  '90d': 30,
  custom: 14,
};

const PLATFORM_WEIGHTS = {
  tiktok: 0.44,
  instagram: 0.33,
  youtube: 0.23,
};

const clamp = (value, min = 0) => (value < min ? min : value);

const parsePlatform = (input) => {
  if (input === 'tiktok' || input === 'instagram' || input === 'youtube' || input === 'all') {
    return input;
  }
  return 'all';
};

const parseRange = (input) => {
  if (input === '24h' || input === '7d' || input === '28d' || input === '90d' || input === 'custom') {
    return input;
  }
  return '7d';
};

const parseCompare = (input) => {
  if (!input) return true;
  return !(input === 'false' || input === '0' || input === 'off');
};

const buildTimeseries = (count, platform, scale) => {
  const today = new Date();
  const rows = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    const wave = Math.sin((count - index) / 2.4);
    const trend = (count - index) * 34;
    const baseViews = 9800 * scale + trend + wave * 1200;

    const tiktok = clamp(Math.round(baseViews * PLATFORM_WEIGHTS.tiktok));
    const instagram = clamp(Math.round(baseViews * PLATFORM_WEIGHTS.instagram));
    const youtube = clamp(Math.round(baseViews * PLATFORM_WEIGHTS.youtube));

    const selectedViews =
      platform === 'all'
        ? tiktok + instagram + youtube
        : platform === 'tiktok'
          ? tiktok
          : platform === 'instagram'
            ? instagram
            : youtube;

    rows.push({
      date: date.toISOString().slice(0, 10),
      views: selectedViews,
      likes: clamp(Math.round(selectedViews * 0.075 + Math.cos(index) * 30)),
      comments: clamp(Math.round(selectedViews * 0.012 + Math.sin(index * 1.2) * 9)),
      shares: clamp(Math.round(selectedViews * 0.009 + Math.cos(index * 0.75) * 6)),
      followers: clamp(Math.round((tiktok + instagram) * 0.0038 + Math.sin(index) * 3)),
      subs: clamp(Math.round(youtube * 0.0042 + Math.cos(index) * 2)),
      platform:
        platform === 'all'
          ? {
              tiktok,
              instagram,
              youtube,
            }
          : undefined,
    });
  }

  return rows;
};

const sum = (values) => values.reduce((total, current) => total + current, 0);

const deltaPct = (current, previous) => {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const makeTopContent = (platform) => {
  const source = [
    {
      id: 'yt-1',
      platform: 'youtube',
      title: 'How We Scaled Shorts to 10M Views',
      postedAt: '2026-02-14',
      views: 482100,
      likes: 21200,
      comments: 1440,
      shares: 1900,
    },
    {
      id: 'tt-1',
      platform: 'tiktok',
      title: 'POV: Editing in 30 Seconds',
      postedAt: '2026-02-18',
      views: 391400,
      likes: 33210,
      comments: 1220,
      shares: 2880,
    },
    {
      id: 'ig-1',
      platform: 'instagram',
      title: 'Reel Breakdown: 3 Hook Patterns',
      postedAt: '2026-02-11',
      views: 278600,
      likes: 19440,
      comments: 980,
      shares: 1630,
    },
    {
      id: 'tt-2',
      platform: 'tiktok',
      title: 'Creator Workflow Automation Demo',
      postedAt: '2026-02-09',
      views: 246900,
      likes: 15880,
      comments: 760,
      shares: 1260,
    },
    {
      id: 'yt-2',
      platform: 'youtube',
      title: 'Audience Retention Teardown',
      postedAt: '2026-02-02',
      views: 214500,
      likes: 11320,
      comments: 640,
      shares: 940,
    },
  ];

  return platform === 'all' ? source : source.filter((item) => item.platform === platform);
};

function createAnalyticsMock(account, platform, range, compare) {
  const points = RANGE_POINTS[range];
  const timeseries = buildTimeseries(points, platform, 1);
  const previousTimeseries = compare ? buildTimeseries(points, platform, 0.85) : undefined;

  const viewTotal = sum(timeseries.map((point) => point.views));
  const likeTotal = sum(timeseries.map((point) => point.likes));
  const commentTotal = sum(timeseries.map((point) => point.comments));
  const shareTotal = sum(timeseries.map((point) => point.shares));
  const followerTotal = sum(timeseries.map((point) => point.followers));
  const subTotal = sum(timeseries.map((point) => point.subs));

  const prevViewTotal = compare ? sum(previousTimeseries.map((point) => point.views)) : 0;
  const prevLikeTotal = compare ? sum(previousTimeseries.map((point) => point.likes)) : 0;
  const prevCommentTotal = compare ? sum(previousTimeseries.map((point) => point.comments)) : 0;
  const prevShareTotal = compare ? sum(previousTimeseries.map((point) => point.shares)) : 0;
  const prevFollowerTotal = compare ? sum(previousTimeseries.map((point) => point.followers)) : 0;
  const prevSubTotal = compare ? sum(previousTimeseries.map((point) => point.subs)) : 0;

  const allViewTotals = buildTimeseries(points, 'all', 1).map((point) => point.platform);

  return {
    account,
    platform,
    range,
    totals: {
      views: { value: viewTotal, deltaPct: compare ? deltaPct(viewTotal, prevViewTotal) : undefined },
      likes: { value: likeTotal, deltaPct: compare ? deltaPct(likeTotal, prevLikeTotal) : undefined },
      comments: { value: commentTotal, deltaPct: compare ? deltaPct(commentTotal, prevCommentTotal) : undefined },
      shares: { value: shareTotal, deltaPct: compare ? deltaPct(shareTotal, prevShareTotal) : undefined },
      followers: {
        value: followerTotal,
        deltaPct: compare ? deltaPct(followerTotal, prevFollowerTotal) : undefined,
      },
      subs: { value: subTotal, deltaPct: compare ? deltaPct(subTotal, prevSubTotal) : undefined },
    },
    platformTotals: {
      tiktok: {
        views: sum(allViewTotals.map((item) => item.tiktok)),
        followers: Math.round(sum(allViewTotals.map((item) => item.tiktok)) * 0.0032),
      },
      instagram: {
        views: sum(allViewTotals.map((item) => item.instagram)),
        followers: Math.round(sum(allViewTotals.map((item) => item.instagram)) * 0.0028),
      },
      youtube: {
        views: sum(allViewTotals.map((item) => item.youtube)),
        subs: Math.round(sum(allViewTotals.map((item) => item.youtube)) * 0.0036),
      },
    },
    timeseries,
    previousTimeseries,
    topContent: makeTopContent(platform),
    insights: [
      { level: 'success', text: 'Views are outperforming the previous period by double digits.' },
      { level: 'info', text: 'TikTok contributes the largest share of discovery traffic this range.' },
      { level: 'warn', text: 'Share rate dipped mid-range on Instagram Reels.' },
      { level: 'info', text: 'YouTube retention-driven videos lifted subscription conversion.' },
    ],
  };
}

app.get('/api/analytics', (req, res) => {
  const account = req.query.account ?? '9to5doggo';
  const platform = parsePlatform(req.query.platform);
  const range = parseRange(req.query.range);
  const compare = parseCompare(req.query.compare);

  res.json(createAnalyticsMock(account, platform, range, compare));
});

app.get('/api/n8n/workflows', async (_req, res) => {
  if (!requireN8nConfig(res)) return;

  try {
    const response = await n8nRequest('/api/v1/workflows');
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = body?.message ?? body?.error ?? body?.detail ?? 'Failed to fetch workflows from n8n';
      console.error('[n8n] GET /api/v1/workflows failed:', response.status, body);
      res.status(response.status).json({ error: errMsg });
      return;
    }

    const raw = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.workflows)
        ? body.workflows
        : Array.isArray(body)
          ? body
          : [];

    console.log('[n8n] raw workflows:', raw.map(w => ({ id: w.id, name: w.name, active: w.active, isArchived: w.isArchived })));

    const workflows = raw
      .filter((item) => !item.isArchived)
      .map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? 'Untitled workflow'),
      }))
      .filter((item) => item.id);

    res.json({ workflows });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Unable to reach n8n',
    });
  }
});

app.post('/api/n8n/workflows/:workflowId/run', async (req, res) => {
  const { workflowId } = req.params;
  const { webhookUrl, ...payload } = req.body ?? {};

  if (!webhookUrl) {
    res.status(400).json({ error: 'No webhook URL configured for this workflow. Open Settings and paste the webhook URL from n8n.' });
    return;
  }

  const cleanUrl = webhookUrl.trim().replace(/\/+$/, '');

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      res.status(response.status).json({
        error: `${body?.message ?? 'Webhook returned an error'} (called: ${cleanUrl})`,
      });
      return;
    }

    res.json({ ok: true, workflowId, run: body });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Unable to reach webhook URL',
    });
  }
});

app.post('/workflow/start', (req, res) => {
  const { task_name = 'Workflow', agent_id = 'agent-01', run_id = 'unknown' } = req.body;
  broadcast({
    event: 'start',
    task_name,
    agent_id,
    run_id,
    started_at: Date.now(),
  });
  res.json({ ok: true });
});

app.post('/workflow/complete', (req, res) => {
  const { task_name = 'Workflow', agent_id = 'agent-01', run_id = 'unknown', result_url } = req.body;
  broadcast({
    event: 'complete',
    task_name,
    agent_id,
    run_id,
    result_url: result_url ?? null,
    completed_at: Date.now(),
  });
  lastEvent = null;
  res.json({ ok: true });
});

app.post('/dev/start', (req, res) => {
  const task_name = req.body?.task_name ?? 'Test Task';
  broadcast({
    event: 'start',
    task_name,
    agent_id: 'agent-01',
    run_id: `dev-${Date.now()}`,
    started_at: Date.now(),
  });
  res.json({ ok: true, task_name });
});

app.post('/dev/complete', (req, res) => {
  const task_name = req.body?.task_name ?? 'Test Task';
  broadcast({
    event: 'complete',
    task_name,
    agent_id: 'agent-01',
    run_id: `dev-${Date.now()}`,
    completed_at: Date.now(),
  });
  lastEvent = null;
  res.json({ ok: true, task_name });
});

app.post('/workflow/fail', (req, res) => {
  const { task_name = 'Workflow', agent_id = 'agent-01', run_id = 'unknown', error = 'Unknown error' } = req.body;
  broadcast({ event: 'fail', task_name, agent_id, run_id, error, failed_at: Date.now() });
  lastEvent = null;
  res.json({ ok: true });
});

app.post('/dev/fail', (req, res) => {
  const task_name = req.body?.task_name ?? 'Test Task';
  const error = req.body?.error ?? 'Something went wrong';
  broadcast({ event: 'fail', task_name, agent_id: 'agent-01', run_id: `dev-${Date.now()}`, error, failed_at: Date.now() });
  lastEvent = null;
  res.json({ ok: true, task_name });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, clients: clients.size, lastEvent });
});

// ── Video Jobs ────────────────────────────────────────────────────────────────

app.get('/api/video-jobs', async (req, res) => {
  if (!prisma) return dbRequired(res);
  const { accountId, status } = req.query;
  try {
    const where = {};
    if (accountId) where.accountId = accountId;
    if (status)    where.status    = status;
    const jobs = await prisma.videoJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { captions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    res.json({ jobs });
  } catch (e) {
    console.error('[video-jobs GET]', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/video-jobs', (req, res) => {
  const { accountId, title, workflowRunId, videoUrl, thumbUrl, durationSeconds, status, notes } = req.body ?? {};
  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }
  const now = new Date().toISOString();
  const job = {
    id: crypto.randomUUID(),
    accountId,
    workflowRunId:   workflowRunId ?? null,
    title:           title ?? null,
    status:          status ?? 'READY_FOR_REVIEW',
    videoUrl:        videoUrl ?? null,
    thumbUrl:        thumbUrl ?? null,
    durationSeconds: durationSeconds != null ? Number(durationSeconds) : null,
    notes:           notes ?? null,
    createdAt: now,
    updatedAt: now,
    captions: [],
    publishes: [],
  };
  videoJobStore.set(job.id, job);
  res.status(201).json({ job });
});

app.get('/api/video-jobs/:id', async (req, res) => {
  if (!prisma) return dbRequired(res);
  try {
    const job = await prisma.videoJob.findUnique({
      where:   { id: req.params.id },
      include: {
        captions: { orderBy: { createdAt: 'desc' } },
        publishes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!job) return res.status(404).json({ error: 'not found' });
    res.json({ job });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/video-jobs/:id', (req, res) => {
  const job = videoJobStore.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  const { status, notes, title, videoUrl, thumbUrl, durationSeconds } = req.body ?? {};
  if (status          != null) job.status          = status;
  if (notes           != null) job.notes           = notes;
  if (title           != null) job.title           = title;
  if (videoUrl        != null) job.videoUrl        = videoUrl;
  if (thumbUrl        != null) job.thumbUrl        = thumbUrl;
  if (durationSeconds != null) job.durationSeconds = Number(durationSeconds);
  job.updatedAt = new Date().toISOString();
  videoJobStore.set(job.id, job);
  res.json({ job });
});

app.post('/api/burn-in', async (req, res) => {
  if (!prisma) return dbRequired(res);
  const { videoJobId, captionText, stylePreset, position, safeArea } = req.body ?? {};
  if (!videoJobId || !captionText) {
    return res.status(400).json({ error: 'videoJobId and captionText are required' });
  }
  try {
    const job = await prisma.videoJob.findUnique({ where: { id: videoJobId } });
    if (!job) return res.status(404).json({ error: 'VideoJob not found' });

    const caption = await prisma.videoCaption.create({
      data: {
        videoJobId,
        captionText,
        stylePreset: stylePreset ?? 'bold-white',
        position:    position   ?? 'bottom',
        safeArea:    safeArea   ?? true,
        burnStatus:  'queued',
      },
    });
    await prisma.videoJob.update({ where: { id: videoJobId }, data: { status: 'BURNING_IN' } });

    res.status(202).json({ caption });

    runBurnIn(job, caption).catch((err) => console.error('[burn-in] uncaught:', err));
  } catch (e) {
    console.error('[burn-in POST]', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/publish', async (req, res) => {
  if (!prisma) return dbRequired(res);
  const { videoJobId, platforms, caption, scheduledFor } = req.body ?? {};
  if (!videoJobId || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'videoJobId and platforms[] are required' });
  }
  try {
    const job = await prisma.videoJob.findUnique({ where: { id: videoJobId } });
    if (!job) return res.status(404).json({ error: 'VideoJob not found' });

    const publishes = await Promise.all(
      platforms.map((platform) =>
        prisma.publishJob.create({
          data: {
            videoJobId,
            platform,
            publishStatus: 'queued',
            caption:       caption ?? null,
            scheduledFor:  scheduledFor ? new Date(scheduledFor) : null,
          },
        })
      )
    );

    await prisma.videoJob.update({ where: { id: videoJobId }, data: { status: 'PUSHING' } });
    res.status(202).json({ publishes });

    // Stub: simulate posting success after 2 seconds
    setTimeout(async () => {
      for (const pub of publishes) {
        await prisma.publishJob.update({
          where: { id: pub.id },
          data:  { publishStatus: 'success', platformPostId: `stub_${pub.platform}_${Date.now()}` },
        }).catch(() => {});
      }
      await prisma.videoJob.update({ where: { id: videoJobId }, data: { status: 'POSTED' } }).catch(() => {});
    }, 2000);
  } catch (e) {
    console.error('[publish POST]', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/n8n/callback', async (req, res) => {
  if (!prisma) return dbRequired(res);
  const { videoJobId, accountId, title, workflowRunId, videoUrl, thumbUrl, durationSeconds, status, notes } = req.body ?? {};
  try {
    if (videoJobId) {
      const data = {};
      if (status          != null) data.status          = status;
      if (notes           != null) data.notes           = notes;
      if (title           != null) data.title           = title;
      if (thumbUrl        != null) data.thumbUrl        = thumbUrl;
      if (durationSeconds != null) data.durationSeconds = Number(durationSeconds);
      const job = await prisma.videoJob.update({ where: { id: videoJobId }, data });
      return res.json({ ok: true, job });
    }
    if (!accountId || !videoUrl) {
      return res.status(400).json({ error: 'New jobs require accountId and videoUrl' });
    }
    const job = await prisma.videoJob.create({
      data: {
        accountId,
        title:           title ?? null,
        workflowRunId:   workflowRunId ?? null,
        status:          'READY_FOR_REVIEW',
        videoUrl,
        thumbUrl:        thumbUrl ?? null,
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
      },
    });
    res.status(201).json({ ok: true, job });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: e.message });
  }
});


server.listen(PORT, () => {
  console.log(`[CommandCenter] WebSocket + HTTP server running on :${PORT}`);
  console.log('  GET  /api/analytics      — mock analytics data');
  console.log('  GET  /api/n8n/workflows  — list n8n workflows');
  console.log('  POST /api/n8n/workflows/:id/run — run n8n workflow');
  console.log('  POST /workflow/start     — n8n workflow start webhook');
  console.log('  POST /workflow/complete  — n8n workflow complete webhook');
  console.log('  POST /workflow/fail      — n8n workflow fail webhook');
  console.log('  POST /dev/start          — dev trigger');
  console.log('  POST /dev/complete       — dev complete');
  console.log('  POST /dev/fail           — dev fail');
  console.log('  GET  /health             — status check');
  console.log('  ── Video ─────────────────────────────');
  console.log('  GET  /api/video-jobs     — list video jobs');
  console.log('  POST /api/video-jobs     — create video job');
  console.log('  GET  /api/video-jobs/:id — get job + captions + publishes');
  console.log('  PATCH /api/video-jobs/:id — update status/notes/title');
  console.log('  POST /api/burn-in        — burn-in stub (async 202)');
  console.log('  POST /api/publish        — push to platforms (stub)');
  console.log('  POST /api/n8n/callback   — upsert job from n8n');
});
