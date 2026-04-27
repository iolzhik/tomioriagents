import { NextResponse } from 'next/server';
import { createTransfer, listTransfers } from '@/lib/crm/services/transfer.service';
import type { TransferStatus } from '@/lib/crm/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as TransferStatus | null;
    const unitId = searchParams.get('unitId') ?? undefined;

    const filter: { status?: TransferStatus; unitId?: string } = {};
    if (status) filter.status = status;
    if (unitId) filter.unitId = unitId;

    const transfers = listTransfers(Object.keys(filter).length ? filter : undefined);
    return NextResponse.json({ success: true, transfers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { unitId, fromLocation, toLocation, requestedBy } = body;

    if (!unitId || !fromLocation || !toLocation || !requestedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const transfer = createTransfer(unitId, fromLocation, toLocation, requestedBy);
    return NextResponse.json({ success: true, transfer }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unit already has a pending transfer') {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
