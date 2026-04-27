import { NextResponse } from 'next/server';

/**
 * Instagram Graph API — Content Publishing
 * Supports both token types:
 *   - IGAA... (Instagram Graph API token) → uses graph.instagram.com
 *   - EAA...  (Facebook User token)       → uses graph.facebook.com + Pages lookup
 *
 * Flow (immediate):  create container → poll FINISHED → media_publish
 * Flow (scheduled):  create container with published=false + scheduled_publish_time
 */

const IG_BASE = 'https://graph.instagram.com/v22.0';
const FB_BASE = 'https://graph.facebook.com/v22.0';

function toForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// Detect token type by prefix
function isIgToken(token: string) {
  return token.startsWith('IGAA') || token.startsWith('IGQ') || token.startsWith('IG');
}

// Resolve IG user id — handles both token types
async function resolveIgUser(accessToken: string): Promise<{ id: string; username: string; base: string }> {
  if (isIgToken(accessToken)) {
    // Instagram Graph API token — direct call
    const res = await fetch(`${IG_BASE}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
    const data = await res.json();
    if (data.error) throw new Error(`Token error: ${data.error.message}`);
    return { id: data.id, username: data.username || data.id, base: IG_BASE };
  }

  // Facebook User token — go through Pages → IG Business account
  const meRes = await fetch(`${FB_BASE}/me?fields=id&access_token=${encodeURIComponent(accessToken)}`);
  const me = await meRes.json();
  if (me.error) throw new Error(`FB auth error: ${me.error.message}`);

  const pagesRes = await fetch(`${FB_BASE}/${me.id}/accounts?fields=id,instagram_business_account&access_token=${encodeURIComponent(accessToken)}`);
  const pages = await pagesRes.json();
  if (pages.error) throw new Error(`Pages error: ${pages.error.message}`);

  const page = pages.data?.find((p: any) => p.instagram_business_account);
  if (!page) throw new Error('Не найден Instagram Business аккаунт, привязанный к Facebook странице.');

  const igId = page.instagram_business_account.id;
  const igRes = await fetch(`${FB_BASE}/${igId}?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
  const ig = await igRes.json();
  if (ig.error) throw new Error(`IG account error: ${ig.error.message}`);

  return { id: igId, username: ig.username || igId, base: FB_BASE };
}

async function createContainer(base: string, igUserId: string, accessToken: string, mediaUrl: string, caption: string, mediaType: 'IMAGE' | 'VIDEO' | 'REEL' | 'STORY', scheduledUnix?: number): Promise<string> {
  const params: Record<string, string> = { caption, access_token: accessToken };
  
  if (mediaType === 'VIDEO' || mediaType === 'REEL') {
    params.media_type = 'REELS';
    params.video_url = mediaUrl;
  } else if (mediaType === 'STORY') {
    params.media_type = 'STORIES';
    if (mediaUrl.toLowerCase().match(/\.(mp4|mov|avi)$/)) {
      params.video_url = mediaUrl;
    } else {
      params.image_url = mediaUrl;
    }
  } else {
    params.image_url = mediaUrl;
  }

  if (scheduledUnix) {
    params.published = 'false';
    params.scheduled_publish_time = String(scheduledUnix);
  }

  const res = await fetch(`${base}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toForm(params),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Container error: ${data.error.message}`);
  if (!data.id) throw new Error('No container ID returned');
  return data.id;
}

async function pollStatus(base: string, containerId: string, accessToken: string, maxAttempts = 12): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${base}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`);
    const data = await res.json();
    if (data.error) throw new Error(`Poll error: ${data.error.message}`);
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('Media processing failed on Meta side');
    await new Promise(r => setTimeout(r, 2500));
  }
  throw new Error('Media container timed out — try again');
}

async function publishContainer(base: string, igUserId: string, containerId: string, accessToken: string): Promise<string> {
  const res = await fetch(`${base}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: toForm({ creation_id: containerId, access_token: accessToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Publish error: ${data.error.message}`);
  return data.id;
}

async function getLimit(base: string, igUserId: string, accessToken: string) {
  try {
    const res = await fetch(`${base}/${igUserId}/content_publishing_limit?fields=config,quota_usage&access_token=${encodeURIComponent(accessToken)}`);
    const data = await res.json();
    return data.data?.[0] || null;
  } catch { return null; }
}

// GET — verify token + check limit
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get('accessToken');
  if (!accessToken) return NextResponse.json({ success: false, error: 'accessToken required' }, { status: 400 });
  try {
    const { id, username, base } = await resolveIgUser(accessToken);
    const limit = await getLimit(base, id, accessToken);
    return NextResponse.json({ success: true, igUserId: id, username, limit });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST — publish or schedule
export async function POST(req: Request) {
  try {
    const { accessToken, imageUrl, mediaUrl, caption, scheduledAt, mediaType = 'IMAGE' } = await req.json();
    if (!accessToken) return NextResponse.json({ success: false, error: 'Access token required' }, { status: 400 });
    const targetUrl = mediaUrl || imageUrl;
    if (!targetUrl) return NextResponse.json({ success: false, error: 'mediaUrl (public HTTPS URL) required' }, { status: 400 });
    if (!caption && mediaType !== 'STORY') return NextResponse.json({ success: false, error: 'Caption required' }, { status: 400 });

    const { id: igUserId, username, base } = await resolveIgUser(accessToken);
    const limit = await getLimit(base, igUserId, accessToken);

    const isScheduled = !!scheduledAt;
    let scheduledUnix: number | undefined;

    if (isScheduled) {
      const d = new Date(scheduledAt);
      if (d < new Date(Date.now() + 10 * 60 * 1000)) return NextResponse.json({ success: false, error: 'Минимум 10 минут от текущего времени' }, { status: 400 });
      if (d > new Date(Date.now() + 75 * 24 * 60 * 60 * 1000)) return NextResponse.json({ success: false, error: 'Максимум 75 дней вперёд' }, { status: 400 });
      scheduledUnix = Math.floor(d.getTime() / 1000);
    }

    const containerId = await createContainer(base, igUserId, accessToken, targetUrl, caption || '', mediaType, scheduledUnix);

    if (isScheduled) {
      return NextResponse.json({ success: true, scheduled: true, containerId, igUserId, username, scheduledAt, limit, message: `Контент запланирован на ${new Date(scheduledAt).toLocaleString('ru-RU')}` });
    }

    await pollStatus(base, containerId, accessToken);
    const publishId = await publishContainer(base, igUserId, containerId, accessToken);

    return NextResponse.json({ 
      success: true, 
      scheduled: false, 
      publishId, 
      igUserId, 
      username, 
      limit, 
      message: `${mediaType} успешно опубликован в Instagram`, 
      url: `https://www.instagram.com/` 
    });
  } catch (e: any) {
    console.error('[Graph Publish Error]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE — remove from queue (local only, Meta has no delete API for scheduled containers)
export async function DELETE(req: Request) {
  return NextResponse.json({ success: true });
}
