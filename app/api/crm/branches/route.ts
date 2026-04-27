import { NextResponse } from 'next/server';
import { getBranchDirectory, saveBranch } from '@/lib/crm/services/location.service';

export async function GET() {
  try {
    const branches = getBranchDirectory();
    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branchId, name, city, address } = body;

    if (!name || !city) {
      return NextResponse.json(
        { success: false, error: 'Название и город обязательны' },
        { status: 400 }
      );
    }

    const branch = {
      branchId: branchId || 'branch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name,
      city,
      address: address || '',
    };

    const saved = saveBranch(branch);
    return NextResponse.json({ success: true, branch: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
