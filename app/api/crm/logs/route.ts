import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/crm-service';

export async function GET() {
  try {
    const logs = await getAuditLogs();
    // Prisma already sorts by timestamp desc, but we can double check or just return
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
