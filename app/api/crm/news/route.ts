import { NextResponse } from 'next/server';
import { getNews, saveNews } from '@/lib/crm-service';

export async function GET() {
  return NextResponse.json({ success: true, news: getNews() });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    saveNews(data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
// Trigger hot reload
