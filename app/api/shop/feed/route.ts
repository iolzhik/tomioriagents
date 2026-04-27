import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/crm-service';

export async function GET() {
  try {
    const products = await getProducts();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const items = products.map(p => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(`${p.name} - Премиальное украшение от Tomiori. Артикул: ${p.article}`)}</g:description>
      <g:link>${baseUrl}/shop/product/${p.id}</g:link>
      <g:image_link>${p.imageUrl || `${baseUrl}/logo.png`}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${p.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${p.price} KZT</g:price>
      <g:brand>Tomiori</g:brand>
      <g:google_product_category>188</g:google_product_category>
      <g:custom_label_0>${escapeXml(p.category)}</g:custom_label_0>
    </item>`).join('');

    const xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Tomiori High Jewelry Catalog</title>
    <link>${baseUrl}</link>
    <description>Синхронизация склада Tomiori с Instagram/Facebook Shop</description>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}
