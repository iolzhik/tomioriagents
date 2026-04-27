import { NextResponse } from 'next/server';
import { getClients, getUpcomingAnniversaries } from '@/lib/crm/services/lead.service';

export async function GET() {
  const clients = await getClients();
  const anniversaries = await getUpcomingAnniversaries();
  return NextResponse.json({ success: true, clients, anniversaries });
}
