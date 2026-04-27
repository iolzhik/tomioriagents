import { NextResponse } from 'next/server';
import { getManagers } from '@/lib/crm-service';
import { applyManagerOverlay } from '@/lib/crm/services/manager-overlay.service';

const ELMIRA_OVERRIDE_PERMISSIONS = JSON.stringify({
  kanban: true,
  creative: true,
  warehouse: true,
  analytics: true,
  receipts: true,
  accounting: false,
  shop: false,
  website_cms: false,
  hr: false,
});

function applyAccessOverrides(managers: any[]): any[] {
  const out = (managers || []).map((m: any) => ({ ...m }));
  const elmiraIdx = out.findIndex((m: any) => String(m?.login || '').trim().toLowerCase() === 'elmira');

  if (elmiraIdx !== -1) {
    out[elmiraIdx].permissions = ELMIRA_OVERRIDE_PERMISSIONS;
    const elmira = out[elmiraIdx];
    // Alias login "elmirat" for the same account (same id/password/permissions).
    out.push({ ...elmira, login: 'elmirat', name: elmira.name || 'Elmirat' });
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();
    const normalizedLogin = String(login || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    if (!normalizedLogin || !normalizedPassword) {
      return NextResponse.json({ success: false, error: 'Введите логин и пароль' }, { status: 400 });
    }
    const managers = applyAccessOverrides(applyManagerOverlay(await getManagers() as any[]));
    
    let manager = managers.find((m: any) =>
      String(m?.login || '').trim().toLowerCase() === normalizedLogin &&
      String(m?.password || '') === normalizedPassword
    );

    // Compatibility alias: allow "elmirat" to access the Elmira account.
    if (!manager && normalizedLogin === 'elmirat' && normalizedPassword) {
      manager = managers.find((m: any) => String(m?.login || '').trim().toLowerCase() === 'elmirat')
        || managers.find((m: any) => String(m?.login || '').trim().toLowerCase() === 'elmira')
        || null;
    }
    
    if (!manager) {
      return NextResponse.json({ success: false, error: 'Неверный логин или пароль' }, { status: 401 });
    }
    
    // In a real app we'd set a cookie/token here
    const { password: _, ...safeManager } = manager;
    return NextResponse.json({ success: true, manager: safeManager });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
