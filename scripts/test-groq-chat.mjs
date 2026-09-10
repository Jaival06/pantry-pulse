import fs from 'node:fs';
import { loadEnvFile } from 'node:process';
import { stripTypeScriptTypes } from 'node:module';

loadEnvFile('.env');
if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing.');

let source = '';
for (const name of ['conversation']) {
  source += stripTypeScriptTypes(
    fs.readFileSync(`lib/agents/${name}.ts`, 'utf8').replace(/^import .*?;\r?\n/gm, ''),
    { mode: 'transform' },
  );
}
const { ConversationAgent } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

const report = {
  finance: {
    start: '2026-01-01', end: '2026-01-30', revenue: 180, contribution: 120,
    margin: 66.67, wasteCost: 3, units: 20, wasteUnits: 1, daily: [],
    items: [{ item_id: 'TEST_01', item_name: 'Test Coffee', category: 'Beverage',
      selling_price: 9, cost_price: 3, units: 20, wasteUnits: 1,
      revenue: 180, wasteCost: 3, contribution: 117, margin: 65 }],
  },
  forecasts: [{ item_id: 'TEST_01', item_name: 'Test Coffee', category: 'Beverage',
    selling_price: 9, cost_price: 3, points: [], method: 'Same-weekday average', mae: 2,
    observations: 30, confidence: 'Moderate', stockDate: '2026-01-30', closing: 25,
    balance: 25, lead: 2, threshold: 18, reorder: false, quantity: 0,
    coverage: 3.5, total: 49, stockReliable: true }],
  alerts: [], actions: [],
  trace: [{ agent: 'Financial Analytics', status: 'complete', durationMs: 1,
    detail: 'Synthetic test output.' }],
  quality: { issues: [], total: 61, accepted: 61, sales: 30, inventory: 30,
    menu: 1, start: '2026-01-01', end: '2026-01-30' },
  generatedAt: '2026-01-30T00:00:00.000Z', horizon: 7, days: 30, category: 'All',
};

const result = await new ConversationAgent().run(
  process.argv.slice(2).join(' ') || 'Which menu item contributes the most, and what evidence supports that answer?',
  report,
  { groqKey: process.env.GROQ_API_KEY, groqModel: process.env.GROQ_MODEL },
);
console.log(JSON.stringify({
  mode: result.mode, provider: result.provider, model: result.model,
  sources: result.sources, tools: result.tools, usage: result.usage,
  answerPresent: Boolean(result.answer?.trim()),
}));
