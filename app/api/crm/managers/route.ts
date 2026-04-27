import { NextResponse } from 'next/server';
import { getManagers, authenticateManager, updateManager } from '@/lib/crm-service';
import { prisma } from '@/lib/prisma';
import {
  applyManagerOverlay,
  overlayCreateManager,
  overlayDeleteManager,
  overlayUpdateManager,
} from '@/lib/crm/services/manager-overlay.service';

function normalizePermissions(raw: any) {
  if (raw === undefined || raw === null || raw === '') return '{}';
  if (typeof raw === 'string') {
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      return '{}';
    }
  }
  if (typeof raw === 'object') return JSON.stringify(raw);
  return '{}';
}

function optionalString(v: any) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

export async function GET() {
  try {
    const managers = await getManagers();
    const merged = applyManagerOverlay(managers as any[]);
    return NextResponse.json({ success: true, managers: merged });
  } catch (error: any) {
    // Never fail hard for managers list: UI depends on this endpoint.
    const merged = applyManagerOverlay([]);
    return NextResponse.json({ success: true, managers: merged, warning: error?.message || 'fallback' });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const normalizedLogin = String(data?.login || '').trim().toLowerCase();
    const rawPassword = String(data?.password || '');

    // Auth mode (login + password only, no name)
    if (!data.name && data.login && data.password) {
      const baseManagers = await getManagers();
      const mergedManagers = applyManagerOverlay(baseManagers as any[]);
      const manager = mergedManagers.find((m: any) =>
        String(m?.login || '').trim().toLowerCase() === normalizedLogin &&
        String(m?.password || '') === rawPassword
      ) || await authenticateManager(String(data.login || '').trim(), rawPassword);
      if (!manager) return NextResponse.json({ success: false, error: 'Invalid login or password' }, { status: 401 });
      return NextResponse.json({ success: true, manager });
    }

    // Create manager mode
    const { name, login, password, role, phone, hireDate, branchId, permissions } = data;
    if (!name || !login) return NextResponse.json({ success: false, error: 'name and login required' }, { status: 400 });

    const normalizedCreateLogin = String(login).trim();
    if (!rawPassword) {
      return NextResponse.json({ success: false, error: 'Пароль обязателен для нового менеджера' }, { status: 400 });
    }
    const createData = {
      name: String(name).trim(),
      login: normalizedCreateLogin,
      password: rawPassword,
      role: optionalString(role) || 'sales',
      phone: optionalString(phone),
      hireDate: optionalString(hireDate),
      branchId: optionalString(branchId),
      permissions: normalizePermissions(permissions),
    };

    try {
      const manager = await prisma.manager.create({ data: createData });
      return NextResponse.json({ success: true, manager }, { status: 201 });
    } catch {
      const existingManagers = applyManagerOverlay(await getManagers() as any[]);
      if (existingManagers.some((m: any) => String(m.login || '').trim().toLowerCase() === String(login || '').trim().toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Логин уже занят' }, { status: 409 });
      }

      const manager = overlayCreateManager({
        id: `m${Date.now()}`,
        ...createData,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, manager }, { status: 201 });
    }
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'Логин уже занят' }, { status: 409 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    // Serialize permissions if object
    if ('permissions' in updates) updates.permissions = normalizePermissions(updates.permissions);
    if ('name' in updates) updates.name = optionalString(updates.name);
    if ('login' in updates) updates.login = optionalString(updates.login);
    if ('role' in updates) updates.role = optionalString(updates.role);
    if ('phone' in updates) updates.phone = optionalString(updates.phone);
    if ('hireDate' in updates) updates.hireDate = optionalString(updates.hireDate);
    if ('branchId' in updates) updates.branchId = optionalString(updates.branchId);
    // Remove empty password
    if (!updates.password) delete updates.password;
    else updates.password = optionalString(updates.password);

    try {
      const manager = await updateManager(id, updates);
      return NextResponse.json({ success: true, manager });
    } catch {
      const manager = overlayUpdateManager(id, updates);
      return NextResponse.json({ success: true, manager });
    }
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'Логин уже занят' }, { status: 409 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    try {
      await prisma.manager.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      overlayDeleteManager(id);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
