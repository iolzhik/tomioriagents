import { NextResponse } from 'next/server';
import { generateJewelryCaption } from '@/lib/openai';
import { VisualEngine } from '@/lib/visual-engine';
import { RAGEngine } from '@/lib/rag-engine';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

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
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { type, size, bg, bgImage, logoImage, font, logo, buttonText, mainText, logoScale, positions, openaiKey } = body;
      
      if (type === 'creative') {
        const visualEngine = new VisualEngine();
        const finalImagePath = await visualEngine.generateCreative({
          size, bg, bgImage, logoImage, font, logo, buttonText, mainText, logoScale, positions
        });
        
        return NextResponse.json({ 
          success: true, 
          thumbnail: `/outputs/${path.basename(finalImagePath)}`,
          logs: [`[${new Date().toLocaleTimeString()}] Creative generated: ${size} size, ${bg} background.`]
        });
      }
    }

    const formData = await req.formData();
    const itemType = formData.get('itemType') as string;
    const narrative = formData.get('narrative') as string;
    const platforms = JSON.parse(formData.get('platforms') as string);
    const scheduleTime = formData.get('scheduleTime') as string;
    const openaiKey = formData.get('openaiKey') as string;
    const openRouterKey = formData.get('openRouterKey') as string;
    const grokKey = formData.get('grokKey') as string;
    const geminiKey = formData.get('geminiKey') as string;
    const aiProvider = formData.get('aiProvider') as 'openai' | 'openrouter' | 'grok' | 'gemini';
    const selectedModel = formData.get('selectedModel') as string;
    const file = formData.get('file') as File | null;
    const credentials = JSON.parse(formData.get('credentials') as string);

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!config.apiKey) {
      return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 });
    }

    const logs = [
      `[${new Date().toLocaleTimeString()}] Initializing Luxury Content Engine...`,
    ];

    // 1. Generate Caption based on brand context
    const caption = await generateJewelryCaption(itemType, narrative, config);
    if (!caption) throw new Error("AI Caption generation failed");
    logs.push(`[${new Date().toLocaleTimeString()}] AI Caption generated with RAG context.`);

    // Self-Learning: Save generated caption to Memory Bank
    const rag = new RAGEngine(config);
    await rag.learnFromSystemOutput('content', `Post Generation for ${itemType}`, caption);

    let finalImagePath = '';
    
    // 2. Generate Brand Creative if file is provided
    if (file) {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      
      const tempFilePath = path.join(tempDir, `upload-${Date.now()}-${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
      
      const visualEngine = new VisualEngine();
      try {
        // Ensure templates and outputs dirs exist
        if (!fs.existsSync(path.join(process.cwd(), 'outputs'))) fs.mkdirSync(path.join(process.cwd(), 'outputs'));
        if (!fs.existsSync(path.join(process.cwd(), 'templates'))) fs.mkdirSync(path.join(process.cwd(), 'templates'));
        
        // Check if template exists, if not use the raw image as a fallback
        const templatePath = path.join(process.cwd(), 'templates', 'tomiori_luxury_template.png');
        if (fs.existsSync(templatePath)) {
          finalImagePath = await visualEngine.generateSocialPost(
            'tomiori_luxury_template.png', 
            tempFilePath, 
            itemType
          );
          logs.push(`[${new Date().toLocaleTimeString()}] Visual Branded (Sharp Engine: Success).`);
        } else {
          finalImagePath = tempFilePath;
          logs.push(`[${new Date().toLocaleTimeString()}] Branded template not found, using original image.`);
        }
      } catch (err) {
        console.error('Visual Engine failed:', err);
        finalImagePath = tempFilePath;
        logs.push(`[${new Date().toLocaleTimeString()}] Visual branding failed, using original image.`);
      }
    }

    // 3. Real Automation using instagrapi
    const results: any[] = [];

    for (const platform of platforms) {
      if (platform === 'instagram' && credentials.instagram_username && credentials.instagram_password && finalImagePath) {
        logs.push(`[${new Date().toLocaleTimeString()}] [INSTAGRAM] Attempting real post for @${credentials.instagram_username}...`);
        try {
          const res = await postToInstagram(
            credentials.instagram_username, 
            credentials.instagram_password, 
            finalImagePath, 
            caption,
            credentials.instagram_proxy
          );
          results.push({ platform, status: 'Posted', url: res.url });
          logs.push(`[${new Date().toLocaleTimeString()}] [INSTAGRAM] Post successful: ${res.url}`);
        } catch (err: any) {
          logs.push(`[${new Date().toLocaleTimeString()}] [INSTAGRAM] Real post failed: ${err.message}. Falling back to schedule simulation.`);
          results.push({ platform, status: 'Scheduled', time: scheduleTime });
        }
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] [${platform.toUpperCase()}] Simulation Mode: Post scheduled for ${scheduleTime}`);
        results.push({ platform, status: 'Scheduled', time: scheduleTime });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results, 
      caption, 
      thumbnail: finalImagePath ? `/outputs/${path.basename(finalImagePath)}` : '',
      logs 
    });

  } catch (error: any) {
    console.error('Post API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
