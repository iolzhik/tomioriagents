import { NextResponse } from 'next/server';
import { endWorkDay } from '@/lib/crm/services/workday.service';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    if (action !== 'end') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const workDay = endWorkDay(id);
    return NextResponse.json({ success: true, workDay });
  } catch (error: any) {
    if (error.message === 'Рабочий день уже завершён') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
