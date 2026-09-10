import fs from 'node:fs';

const menu = [
  { item_id: 'SAMPLE_01', item_name: 'House Coffee', category: 'Beverage', selling_price: '4.5', cost_price: '1.2' },
  { item_id: 'SAMPLE_02', item_name: 'Iced Tea', category: 'Beverage', selling_price: '5', cost_price: '1.4' },
  { item_id: 'SAMPLE_03', item_name: 'Veggie Sandwich', category: 'Food', selling_price: '9.5', cost_price: '4.1' },
  { item_id: 'SAMPLE_04', item_name: 'Chocolate Muffin', category: 'Food', selling_price: '4', cost_price: '1.5' },
];

const sales = [];
const inventory = [];
const start = new Date('2026-06-01T00:00:00Z');
for (let day = 0; day < 92; day++) {
  const date = new Date(start.getTime() + day * 86400000).toISOString().slice(0, 10);
  for (let item = 0; item < menu.length; item++) {
    const quantity = 10 + ((day * 7 + item * 11) % 24);
    sales.push({ date, item_id: menu[item].item_id, quantity_sold: String(quantity), payment_type: day % 3 ? 'Card' : 'Cash', status: 'COMPLETED' });
    inventory.push({ date, item_id: menu[item].item_id, starting_stock: String(70 + ((day + item * 9) % 35)), wastage_units: String((day + item) % 11 === 0 ? 3 : 1), reorder_threshold: '24', supplier_lead_days: '2' });
  }
}

fs.writeFileSync(new URL('../data/seed.json', import.meta.url), `${JSON.stringify({ menu, sales, inventory }, null, 2)}\n`);
