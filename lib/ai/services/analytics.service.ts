import { AIConfig, getAIResponse, normalizeConfig } from '../config';
import { getMemoryBank } from '../memory';

export async function generateCrmAnalytics(leadsData: any[], managersData: any[], stats: any, configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const metrics = {
    totalLeads: leadsData.length,
    conversionRate: stats?.conversionRate || 'N/A',
    avgDealSize: stats?.avgDealSize || 'N/A',
    leadsBySource: leadsData.reduce((acc: any, lead: any) => { 
      const s = lead.source || 'Unknown'; acc[s] = (acc[s] || 0) + 1; return acc; 
    }, {}),
    leadsByStatus: leadsData.reduce((acc: any, lead: any) => { 
      const s = lead.status || 'New'; acc[s] = (acc[s] || 0) + 1; return acc; 
    }, {}),
    managerPerformance: (managersData || []).map(m => ({
      name: m.name, leads: m.leadsCount || 0, deals: m.dealsCount || 0,
      conversion: m.leadsCount > 0 ? ((m.dealsCount / m.leadsCount) * 100).toFixed(1) + '%' : '0%'
    }))
  };
  const prompt = `
    SYSTEM: You are a World-Class Business Intelligence Analyst and Sales Strategist for "Tomiori".
    BRAND_CONTEXT: ${memory}
    METRICS SUMMARY: ${JSON.stringify(metrics, null, 2)}
    RAW DATA SAMPLE (Latest Leads): ${JSON.stringify(leadsData.slice(-30))}
    TASK: Generate a deep, professional AI Executive Report for the brand owner in Russian. Analyze funnels, bottlenecks, and growth strategies.
  `;
  return await getAIResponse(prompt, config, "Tomiori Business Intelligence");
}

export async function generateAccountingAnalytics(entries: any[], leads: any[], configInput?: AIConfig | string) {
  const config = normalizeConfig(configInput);
  const memory = getMemoryBank('brand', config);
  const metrics = {
    totalEntries: entries.length,
    totalIncome: entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
    totalExpense: entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
    totalTax: entries.filter(e => e.type === 'income').reduce((sum, e) => sum + (e.taxDetails?.incomeTax || 0) + (e.taxDetails?.vat || 0), 0),
    categories: entries.reduce((acc: any, e: any) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})
  };
  const prompt = `
    SYSTEM: Вы — Старший Финансовый Аудитор и Налоговый Консультант Tomiori (РК 2026).
    BRAND_CONTEXT: ${memory}
    ДАННЫЕ: ${JSON.stringify(metrics, null, 2)}
    ЗАДАЧА: Проанализируйте финансовые операции, рассчитайте чистую прибыль и дайте экспертное заключение по налогам и оптимизации расходов.
  `;
  return await getAIResponse(prompt, config, "Tomiori Financial Director");
}
