import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

export async function GET() {
  try {
    const backup: Record<string, any> = {};
    const files = fs.readdirSync(KNOWLEDGE_DIR);

    for (const file of files) {
      const filePath = path.join(KNOWLEDGE_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      if (file.endsWith('.json')) {
        backup[file] = JSON.parse(content);
      } else {
        backup[file] = content;
      }
    }

    return NextResponse.json({ success: true, backup, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { backup } = await req.json();
    if (!backup) return NextResponse.json({ success: false, error: 'Backup data required' }, { status: 400 });

    for (const [fileName, content] of Object.entries(backup)) {
      const filePath = path.join(KNOWLEDGE_DIR, fileName);
      const finalContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      fs.writeFileSync(filePath, finalContent, 'utf8');
    }

    return NextResponse.json({ success: true, message: 'System restored successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
