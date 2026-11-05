// 学生閲覧用ギャラリー API (Vercel Functions + Private Vercel Blob)
//
//   GET    /api/galleries?id=xxx   … 学生ページ用。{ id, title, urls, updatedAt } を返す
//   POST   /api/galleries          … 採点サイトから転送 (要トークン)。{ id?, title, urls } → { id }
//   DELETE /api/galleries?id=xxx   … 公開停止 (要トークン)
//
// 環境変数
//   BLOB_READ_WRITE_TOKEN … Private Blob ストアを接続すると自動で設定される
//   ADMIN_TOKEN           … 転送・削除用の合言葉 (採点サイトで入力するもの)
//   ALLOWED_ORIGIN        … 採点サイトのオリジン。カンマ区切りで複数可
//                           (既定: https://web.fujimura.com,https://kofujimura.github.io)
import { put, get, del } from '@vercel/blob';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'https://web.fujimura.com,https://kofujimura.github.io')
  .split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
const MAX_URLS = 500;
const ID_RE = /^[a-z0-9]{12}$/;
// 受け付けるのは CodeSandbox のプレビュー URL のみ
const URL_RE = /^https:\/\/[a-z0-9]+\.csb\.app(\/[^\s?#"'<>]*)?$/;

const blobPath = id => `galleries/${id}.json`;

function cors(request) {
  const origin = request.headers.get('origin');
  return ALLOWED_ORIGINS.includes(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' };
}

function json(request, status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(request), ...extra },
  });
}

function authorized(request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const m = (request.headers.get('authorization') || '').match(/^Bearer (.+)$/);
  if (!m) return false;
  const a = Buffer.from(m[1]), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function newId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(randomBytes(12), x => chars[x % chars.length]).join('');
}

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!ID_RE.test(id)) return json(request, 400, { error: 'invalid id' });
  const res = await get(blobPath(id), { access: 'private', useCache: false });
  if (!res || res.statusCode !== 200) return json(request, 404, { error: 'not found' });
  const data = JSON.parse(await new Response(res.stream).text());
  return json(request, 200, data, { 'Cache-Control': 'public, max-age=0, s-maxage=30' });
}

export async function POST(request) {
  if (!authorized(request)) return json(request, 401, { error: 'unauthorized' });
  let body;
  try { body = await request.json(); } catch { return json(request, 400, { error: 'invalid json' }); }

  const id = body.id == null || body.id === '' ? newId() : String(body.id);
  if (!ID_RE.test(id)) return json(request, 400, { error: 'invalid id' });
  const title = String(body.title || '').trim().slice(0, 100) || '作品ギャラリー';
  if (!Array.isArray(body.urls)) return json(request, 400, { error: 'urls must be an array' });
  const urls = body.urls.map(String).filter(u => URL_RE.test(u));
  if (!urls.length) return json(request, 400, { error: 'no valid csb.app urls' });
  if (urls.length > MAX_URLS) return json(request, 400, { error: 'too many urls' });

  const data = { id, title, urls, updatedAt: new Date().toISOString() };
  await put(blobPath(id), JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  return json(request, 200, { id, count: urls.length });
}

export async function DELETE(request) {
  if (!authorized(request)) return json(request, 401, { error: 'unauthorized' });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!ID_RE.test(id)) return json(request, 400, { error: 'invalid id' });
  await del(blobPath(id));
  return json(request, 200, { ok: true });
}
