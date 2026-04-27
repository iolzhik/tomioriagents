import { NextResponse } from 'next/server';
import { getReceipts, saveReceipt, saveAuditLog, getManagers, getLeads } from '@/lib/crm-service';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const verify = searchParams.get('verify');
    
    const receipts = await getReceipts();
    
    if (id) {
      const receipt = receipts.find(r => r.id === id);
      if (!receipt) return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
      
      if (verify) {
        if (receipt.verificationCode === verify) {
          return NextResponse.json({ success: true, verified: true, receipt });
        } else {
          return NextResponse.json({ success: false, verified: false, error: 'Invalid verification code' }, { status: 403 });
        }
      }
      return NextResponse.json({ success: true, receipt });
    }
    
    return NextResponse.json({ success: true, receipts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { leadId, managerId } = data;
    
    const leads = await getLeads();
    const lead = leads.find(l => l.id === String(leadId));
    
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    
    const managers = await getManagers();
    const manager = managers.find(m => m.id === managerId);
    
    if (!manager) return NextResponse.json({ success: false, error: 'Manager not found' }, { status: 404 });

    const verificationCode = crypto.randomBytes(8).toString('hex');

    const receipt = await saveReceipt({
      leadId: String(lead.id),
      customerName: lead.name,
      customerPhone: lead.phone,
      products: typeof lead.products === 'string' ? lead.products : JSON.stringify(lead.products || []),
      totalAmount: lead.paymentAmount || lead.finalPrice || 0,
      paymentMethod: lead.paymentMethod || 'unknown',
      verificationCode: verificationCode,
      timestamp: new Date()
    });

    await saveAuditLog({
      managerId,
      managerName: manager.name,
      action: 'GENERATE_RECEIPT',
      details: `Сгенерирован чек для лида #${leadId}`,
      targetId: receipt.id
    });

    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
