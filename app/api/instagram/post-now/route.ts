import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function postToInstagram(username: string, password: string, imagePath: string, caption: string, proxy?: string): Promise<any> {
  const scriptPath = path.resolve(process.cwd(), 'instagram_engine.py');
  const env = { ...process.env };
  if (proxy) {
    env.IG_PROXY = proxy;
  }
  
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, username, password, 'post_photo', imagePath, caption], { env });
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || `Python script exited with code ${code}`));
      } else {
        try {
          const start = output.lastIndexOf('{');
          const end = output.lastIndexOf('}') + 1;
          const result = JSON.parse(output.substring(start, end));
          if (result.success) resolve(result);
          else reject(new Error(result.error));
        } catch (e) {
          reject(new Error('Failed to parse Instagram engine output'));
        }
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const caption = formData.get('caption') as string;
    const file = formData.get('file') as File | null;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const proxy = formData.get('proxy') as string;
    const imagePathFromStudio = formData.get('imagePath') as string; // Optional: If we already have a generated image path

    if (!username || !password || (!file && !imagePathFromStudio)) {
      return NextResponse.json({ success: false, error: 'Missing credentials or media' }, { status: 400 });
    }

    let finalImagePath = imagePathFromStudio || '';

    // If a new file is uploaded, save it
    if (file) {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      
      const tempFilePath = path.join(tempDir, `instant-${Date.now()}-${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
      finalImagePath = tempFilePath;
    }

    if (!finalImagePath || !fs.existsSync(finalImagePath)) {
      return NextResponse.json({ success: false, error: 'Image file not found' }, { status: 404 });
    }

    const result = await postToInstagram(username, password, finalImagePath, caption || '', proxy);
    
    return NextResponse.json({ 
      success: true, 
      url: result.url,
      media_id: result.media_id,
      message: 'Пост успешно опубликован!'
    });

  } catch (error: any) {
    console.error('Instant Post API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
