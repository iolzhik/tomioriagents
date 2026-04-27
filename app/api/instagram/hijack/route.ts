
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { targetUsername, credentials, count = 30 } = await req.json();

    if (!targetUsername || !credentials?.username || !credentials?.password) {
      return NextResponse.json({ success: false, error: 'Target and credentials required' }, { status: 400 });
    }

    const scriptPath = path.resolve(process.cwd(), 'instagram_engine.py');
    const pythonProcess = spawn('python3', [scriptPath, credentials.username, credentials.password, 'get_followers', targetUsername, count.toString()]);

    let output = '';
    let errorOutput = '';

    return new Promise<NextResponse>((resolve) => {
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          const start = output.lastIndexOf('{');
          const end = output.lastIndexOf('}') + 1;
          const result = JSON.parse(output.substring(start, end));
          resolve(NextResponse.json(result));
        } catch (e) {
          resolve(NextResponse.json({ success: false, error: 'Failed to parse engine output' }, { status: 500 }));
        }
      });
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
