import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { getAIResponse, AIConfig } from './openai';


const MEMORY_PATH = path.join(process.cwd(), 'knowledge', 'tomiori_memory.md');
const FALLBACK_MEMORY_PATH = '/tmp/tomiori_memory.md';
let runtimeMemoryCache = '# Tomiori Brand Memory\n';

function readMemoryBank(): string {
  try {
    if (fs.existsSync(MEMORY_PATH)) return fs.readFileSync(MEMORY_PATH, 'utf8');
  } catch {}

  try {
    if (fs.existsSync(FALLBACK_MEMORY_PATH)) return fs.readFileSync(FALLBACK_MEMORY_PATH, 'utf8');
  } catch {}

  return runtimeMemoryCache;
}

function writeMemoryBank(content: string): void {
  runtimeMemoryCache = content;

  try {
    const dir = path.dirname(MEMORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MEMORY_PATH, content, 'utf8');
    return;
  } catch (err: any) {
    if (err?.code !== 'EROFS') {
      console.warn(`[RAG Engine] Failed to write memory to ${MEMORY_PATH}: ${err?.message || err}`);
    }
  }

  try {
    const tmpDir = path.dirname(FALLBACK_MEMORY_PATH);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(FALLBACK_MEMORY_PATH, content, 'utf8');
  } catch (err: any) {
    console.warn(`[RAG Engine] Failed to write fallback memory: ${err?.message || err}`);
  }
}

function buildCompactMemory(memory: string, query: string, maxChars = 12000): string {
  if (!memory || memory.length <= maxChars) return memory;

  const tokens = Array.from(
    new Set(
      (query || '')
        .toLowerCase()
        .split(/[^a-zA-Zа-яА-Я0-9_]+/)
        .filter((t) => t.length >= 3)
    )
  );

  const lines = memory.split('\n');
  const picked = new Set<number>();

  // Keep section headers
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('#')) picked.add(idx);
  });

  // Keep lines related to query with small neighborhood
  if (tokens.length > 0) {
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      if (tokens.some((t) => lower.includes(t))) {
        for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 2); i++) {
          picked.add(i);
        }
      }
    });
  }

  // Always keep the tail because it usually has most recent auto-saved entries
  const tailStart = Math.max(0, lines.length - 220);
  for (let i = tailStart; i < lines.length; i++) picked.add(i);

  const compact = Array.from(picked)
    .sort((a, b) => a - b)
    .map((idx) => lines[idx])
    .join('\n')
    .trim();

  if (compact.length <= maxChars) return compact;
  return compact.slice(compact.length - maxChars);
}

function isRateLimitError(err: any): boolean {
  const msg = String(err?.message || '');
  return err?.status === 429 || /429|rate limit|tokens per min|TPM/i.test(msg);
}

/**
 * RAG Engine to process files and update Tomiori's Memory Bank
 */
export class RAGEngine {
  private config?: AIConfig | string;

  constructor(config?: AIConfig | string) {
    this.config = config;
  }

  /**
   * Main entry point to ingest any supported file or raw text
   */
  async ingestData(data: Buffer | string, fileName: string, mimeType?: string): Promise<string> {
    console.log(`[RAG Engine] Ingesting data: ${fileName}, mime: ${mimeType}`);
    let rawText = '';

    try {
      if (typeof data === 'string') {
        rawText = data;
      } else if (mimeType === 'application/pdf') {
        const pdf = require('pdf-parse');
        const result = await pdf(data instanceof Buffer ? data : Buffer.from(data));
        rawText = result.text;
      } else if (mimeType && (mimeType.includes('spreadsheet') || mimeType.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv'))) {

        const workbook = xlsx.read(data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawText = xlsx.utils.sheet_to_csv(sheet);
      } else if (mimeType && mimeType.startsWith('image/')) {
        rawText = "[Image content extraction is currently limited]";
      } else {
        rawText = data.toString('utf8');
      }

      if (!rawText.trim()) {
        throw new Error("Извлеченный текст пуст.");
      }

      // Now structure the raw text using our shared AI helper
      const structuredInfo = await this.structureInfo(rawText, fileName);
      
      if (!structuredInfo) {
        throw new Error("Не удалось структурировать информацию.");
      }

      // Append to memory bank
      this.updateMemoryBank(structuredInfo);

      return structuredInfo;
    } catch (err: any) {
      console.error(`[RAG Engine Error] ${err.message}`);
      throw err;
    }
  }

  private async structureInfo(text: string, source: string): Promise<string | null> {
    const prompt = `
      SYSTEM: You are the Tomiori Knowledge Architect. Convert raw text into a highly structured, RAG-optimized Markdown format. Identify if the content is about Prices, Schedules, Policies, Inventory, or General Brand Info and place it under appropriate ## headers. Be concise but capture ALL details. If multiple topics are present, use multiple headers.
      SOURCE: ${source}
      RAW_DATA: ${text}
    `;
    
    return await getAIResponse(prompt, this.config, "Tomiori Knowledge Architect");
  }

  private updateMemoryBank(newInfo: string, categoryHeader?: string) {
    const currentMemory = readMemoryBank();
    
    let updatedMemory = '';
    if (categoryHeader && currentMemory.includes(categoryHeader)) {
      // Insert after the existing header
      const parts = currentMemory.split(categoryHeader);
      updatedMemory = parts[0] + categoryHeader + '\n' + newInfo + '\n' + parts.slice(1).join(categoryHeader);
    } else {
      // Append to the end with a timestamped entry
      updatedMemory = `${currentMemory}\n\n### 🆕 New Knowledge Entry (Added ${new Date().toLocaleDateString()})\n${newInfo}\n---`;
    }
    
    writeMemoryBank(updatedMemory);
  }

  /**
   * Automatically learn from system-generated outputs to strengthen the RAG base.
   */
  async learnFromSystemOutput(category: 'content' | 'intel' | 'ads' | 'caption' | 'trends' | 'post_analysis' | 'funnel', source: string, output: string): Promise<void> {
    const headerMap = {
      content: '## 📱 Historical Social Content',
      intel: '## 🕵️ Strategic Intelligence',
      ads: '## 🎯 Advertising Recommendations',
      caption: '## ✍️ Generated Captions & Copy',
      trends: '## 📈 Trend-Based Ideas',
      post_analysis: '## 🧪 Content Performance Analysis',
      funnel: '## 🌪️ Sales Funnel Strategies'
    };

    const categoryHeader = headerMap[category];
    const formattedEntry = `
> **Auto-Saved: ${new Date().toLocaleString()}**
> **SOURCE_TASK:** ${source}
**GENERATED_OUTPUT:**
${output}
---`;

    this.updateMemoryBank(formattedEntry, categoryHeader);
    console.log(`[RAG Self-Learning] Learned new ${category} from ${source}`);
  }

  /**
   * Specialized Chat for Tomiori Business Queries
   */
  async tomioriChat(query: string): Promise<string> {
    const memory = readMemoryBank() || 'No brand data yet.';
    const compactMemory = buildCompactMemory(memory, query, 12000);

    const buildPrompt = (contextMemory: string) => `
      SYSTEM: You are Tomiori Business AI. You ONLY answer questions about Tomiori (Jewelry brand in г.Астана, ТРЦ "Керуен", 2 этаж). 
      Use the following MEMORY BANK as your absolute source of truth. 
      The MEMORY BANK contains:
      - Official brand data (prices, schedules, policies).
      - Historical content generated by the system (captions, posts).
      - Strategic intelligence (competitor analysis, market trends).
      - Previous advertising recommendations.
      
      Always look for the MOST RECENT entries in the memory bank if there's conflicting info. 
      If the user asks "What did we generate before?" or "What's the strategy for X?", search through the Historical Social Content and Strategic Intelligence sections.
      If information is not in memory, politely state that you only have brand-specific knowledge. 
      Be polite, luxury-oriented, and precise. 
      
      CONTEXT_MEMORY:
      ${contextMemory}
      
      USER_QUERY: ${query}
    `;

    try {
      const response = await getAIResponse(buildPrompt(compactMemory), this.config, "Tomiori Business AI");
      return response || 'Извините, я не могу ответить на этот вопрос на основе текущей базы знаний.';
    } catch (err: any) {
      if (!isRateLimitError(err)) throw err;

      // Retry once with extra-compact context for TPM-limited models.
      const tinyMemory = buildCompactMemory(memory, query, 3500);
      const retryResponse = await getAIResponse(buildPrompt(tinyMemory), this.config, "Tomiori Business AI");
      return retryResponse || 'Извините, я не могу ответить на этот вопрос на основе текущей базы знаний.';
    }
  }
}
