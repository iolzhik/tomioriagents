import { NextResponse } from 'next/server';
import { removeBackground } from '@/lib/crm/services/bgremove.service';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    const result = await removeBackground(imageBase64);

    if (!result.success) {
      if (result.error === 'BG removal service not configured') {
        // Tell client to use canvas-based removal
        return NextResponse.json({ success: false, error: result.error, useClientFallback: true }, { status: 503 });
      }
      if (result.error.includes('exceeds maximum size')) {
        return NextResponse.json({ success: false, error: result.error }, { status: 413 });
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, resultBase64: result.resultBase64 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
