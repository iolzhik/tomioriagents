import { NextResponse } from 'next/server';
import { getCategories, saveCategories } from '@/lib/crm-service';

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json({ success: true, categories });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await saveCategories(data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
