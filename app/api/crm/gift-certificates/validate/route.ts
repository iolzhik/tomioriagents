import { NextResponse } from 'next/server';
import { validateCertificate, applyCertificate, getCertificateByCode } from '@/lib/crm/services/certificate.service';
import { createAccountingEntry } from '@/lib/crm-service';

export async function POST(req: Request) {
  try {
    const { code, leadId, managerId } = await req.json();

    const validation = validateCertificate(code, new Date());
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 422 });
    }

    const cert = validation.certificate;
    const certificate = applyCertificate(code, leadId);

    // Accounting: record certificate redemption as income offset
    try {
      await createAccountingEntry({
        type: 'income',
        category: 'Применение сертификата',
        amount: cert.amount,
        description: `Применён сертификат ${code} к сделке #${leadId || '—'} на ${cert.amount.toLocaleString()} ₸`,
        leadId: leadId || undefined,
        managerId: managerId || cert.issuedBy || 'admin',
        isConfirmed: true,
        timestamp: new Date(),
      });
    } catch {}

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
