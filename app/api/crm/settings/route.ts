import { NextResponse } from 'next/server';
import { getGlobalSettings, saveGlobalSettings } from '@/lib/crm-service';

export async function GET() {
  return NextResponse.json({ success: true, settings: getGlobalSettings() });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    saveGlobalSettings(data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
