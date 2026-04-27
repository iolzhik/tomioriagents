import { NextResponse } from 'next/server';
import { listWorkDays, startWorkDay } from '@/lib/crm/services/workday.service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const managerId = searchParams.get('managerId') ?? undefined;
  const date = searchParams.get('date') ?? undefined;
  const workDays = listWorkDays({ managerId, date });
  return NextResponse.json({ success: true, workDays });
}

export async function POST(req: Request) {
  try {
    const { managerId } = await req.json();
    const workDay = startWorkDay(managerId);
    return NextResponse.json({ success: true, workDay }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Рабочий день уже открыт') {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
