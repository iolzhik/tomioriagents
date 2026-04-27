import { NextResponse } from 'next/server';
import { generateCrmAnalytics, generateAccountingAnalytics } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';


export async function POST(req: Request) {
  try {
    const { type, leads, managers, stats, entries, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel } = await req.json();

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    let report = '';

    if (type === 'accounting') {
      if (!entries || !Array.isArray(entries)) {
        return NextResponse.json({ success: false, error: 'Accounting entries are required' }, { status: 400 });
      }
      report = await generateAccountingAnalytics(entries, leads || [], config);
    } else {
      if (!leads || !Array.isArray(leads)) {
        return NextResponse.json({ success: false, error: 'Leads data is required' }, { status: 400 });
      }
      report = await generateCrmAnalytics(leads, managers || [], stats || {}, config);
    }
    
    if (!report) {
      throw new Error("AI returned empty report");
    }

    // Self-Learning: Save report to Memory Bank
    const rag = new RAGEngine(config);
    const reportTitle = type === 'accounting' ? `Financial Audit (${new Date().toLocaleDateString()})` : `CRM Executive Report (${new Date().toLocaleDateString()})`;
    await rag.learnFromSystemOutput('intel', reportTitle, report);

    return NextResponse.json({ success: true, report });

  } catch (error: any) {
    console.error('CRM Analytics API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 }); // Return 200 with success: false for frontend
  }
}
