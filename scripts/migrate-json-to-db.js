const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrate() {
  console.log('--- STARTING CRM 2.0 DATA MIGRATION (JSON -> SQLITE) ---');

  const KNOWLEDGE_DIR = path.join(__dirname, '../knowledge');

  const loadJson = (filename) => {
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log(`Error reading ${filename}`, e);
      return [];
    }
  };

  const managers = loadJson('crm_managers.json');
  const products = loadJson('crm_products.json');
  const leads = loadJson('crm_leads.json');

  console.log('Migrating Managers...');
  for (const m of managers) {
    await prisma.manager.create({
      data: {
        id: m.id,
        name: m.name,
        login: m.login,
        password: m.password || '12345',
        role: m.role || 'sales',
        permissions: JSON.stringify(m.permissions || {})
      }
    });
  }

  console.log('Migrating Products...');
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        category: p.category,
        article: p.article,
        price: parseFloat(p.price) || 0,
        stock: parseInt(p.stock) || 0,
        imageUrl: p.imageUrl,
        description: p.description,
        shortDescription: p.shortDescription
      }
    });
  }

  console.log('Migrating Leads & Auto-creating Clients...');
  for (const l of leads) {
    let clientId = null;
    if (l.phone) {
      const existingClient = await prisma.client.findUnique({ where: { phone: l.phone } });
      if (!existingClient) {
        const client = await prisma.client.create({
          data: {
            name: l.name || 'Anonymous',
            phone: l.phone,
            managerId: l.managerId || managers[0]?.id,
            loyaltyStatus: 'Pearl',
            totalSpent: l.status === 'closed_won' ? (parseFloat(l.finalPrice) || parseFloat(l.productPrice) || 0) : 0,
            birthday: l.birthday || null,
            anniversary: l.anniversary || null
          }
        });
        clientId = client.id;
      } else {
        clientId = existingClient.id;
        if (l.status === 'closed_won') {
          await prisma.client.update({
            where: { id: clientId },
            data: { totalSpent: { increment: (parseFloat(l.finalPrice) || parseFloat(l.productPrice) || 0) } }
          });
        }
      }
    }

    await prisma.lead.create({
      data: {
        id: l.id ? String(l.id) : undefined,
        clientId: clientId,
        name: l.name || 'Legacy',
        phone: l.phone || 'N/A',
        product: l.product || 'Legacy Product',
        productId: l.productId || null,
        status: l.status || 'new',
        source: l.source || 'boutique',
        managerId: l.managerId || managers[0]?.id || 'admin',
        paymentMethod: l.paymentMethod || null,
        paymentAmount: parseFloat(l.paymentAmount) || null,
        productPrice: parseFloat(l.productPrice) || 0,
        discount: parseFloat(l.discount) || 0,
        finalPrice: parseFloat(l.finalPrice) || 0,
        occasion: l.occasion || null,
        fulfillment: l.fulfillmentMethod || 'pickup',
        deliveryAddress: l.deliveryAddress || null,
        createdAt: l.createdAt ? new Date(l.createdAt) : new Date()
      }
    });
  }

  console.log('--- CRM 2.0 DATA MIGRATION COMPLETE! ---');
}

migrate()
  .catch(e => {
    console.error('Migration crashed!', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
