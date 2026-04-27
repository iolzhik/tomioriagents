import { NextResponse } from 'next/server';
import { listCertificates, issueCertificate } from '@/lib/crm/services/certificate.service';
import { createAccountingEntry } from '@/lib/crm-service';

export async function GET() {
  return NextResponse.json({ success: true, certificates: listCertificates() });
}

export async function POST(req: Request) {
  try {
    const { amount, issuedBy, expiresAt } = await req.json();
    const certificate = issueCertificate(amount, issuedBy, expiresAt);

    // Accounting: record certificate issuance as a liability/expense
    try {
      await createAccountingEntry({
        type: 'expense',
        category: 'Подарочный сертификат',
        amount,
        description: `Выпущен сертификат ${certificate.code} на ${amount.toLocaleString()} ₸`,
        managerId: issuedBy || 'admin',
        isConfirmed: true,
        timestamp: new Date(),
      });
    } catch {}

    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
