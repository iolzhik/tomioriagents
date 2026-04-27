import { NextResponse } from 'next/server';
import { getConversations, getMessages, resolveIgBusinessAccountId, debugToken } from '@/lib/instagram-graph';
import { getLeads, createLead, updateLead, type Lead } from '@/lib/crm-service';
import { classifyConversation } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { accessToken, igAccountId, aiConfig } = body;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Access Token отсутствует. Настройте его в Creative Lab.' }, { status: 400 });
    }

    // Diagnostic: Check token permissions
    const tokenInfo = await debugToken(accessToken);
    const permissions = tokenInfo?.scopes || [];
    const hasMessagingScope = permissions.includes('instagram_manage_messages') || permissions.includes('pages_messaging');
    
    console.log(`[CRM Sync] Token Permissions:`, permissions);

    if (!hasMessagingScope) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ваш токен не имеет разрешения на чтение сообщений (instagram_manage_messages). Сгенерируйте новый токен с этим разрешением в Graph API Explorer.',
        diagnostic: { permissions }
      }, { status: 403 });
    }

    if (!igAccountId) {
      // Try to auto-resolve if missing
      try {
        console.log('[CRM Sync] igAccountId missing, attempting auto-resolve...');
        const resolvedId = await resolveIgBusinessAccountId(accessToken);
        igAccountId = resolvedId;
      } catch (e: any) {
        return NextResponse.json({ success: false, error: 'Не удалось определить ID вашего бизнес-аккаунта. Укажите его вручную.' }, { status: 400 });
      }
    }

    console.log(`[CRM Sync] Starting sync for account: ${igAccountId}`);
    let conversations = [];
    try {
      conversations = await getConversations(accessToken, igAccountId);
      console.log(`[CRM Sync] Found ${conversations?.length || 0} conversations`);
    } catch (apiErr: any) {
      console.error('[CRM Sync] Failed to fetch conversations:', apiErr.message);
      return NextResponse.json({ 
        success: false, 
        error: `Ошибка Instagram API: ${apiErr.message}`,
        details: 'Убедитесь, что аккаунт переведен в Business режим и в настройках IG разрешен "Доступ к сообщениям".'
      }, { status: 502 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        leadsCreated: 0, 
        leadsUpdated: 0, 
        totalConversations: 0, 
        message: 'Диалоги не найдены. Убедитесь, что у вас есть активные переписки в Direct.' 
      });
    }

    const existingLeads = await getLeads();
    let leadsUpdated = 0;
    let leadsCreated = 0;

    for (const conv of conversations) {
      const participant = conv.participants?.data?.find((p: any) => p.id !== igAccountId);
      if (!participant) continue;

      const instagramName = participant.username || participant.name || 'IG User';
      const conversationId = conv.id;
      
      // Get last messages for classification
      const messages = conv.messages?.data?.map((m: any) => ({
        text: m.message || '',
        from: m.from?.id === igAccountId ? 'Tomiori' : 'Client'
      })).reverse() || [];

      if (messages.length === 0) continue;

      // Check if lead already exists
      const existingLeadIndex = existingLeads.findIndex(l => 
        l.instagramAccount === instagramName || l.additionalInfo?.includes(conversationId)
      );

      // Determine status using Hybrid approach (Keywords + AI)
      const status = await classifyConversation(messages, aiConfig);

      if (existingLeadIndex !== -1) {
        // Update existing lead status if it's not closed
        const lead = existingLeads[existingLeadIndex];
        if (lead.status !== 'closed_won' && lead.status !== 'closed_lost' && lead.status !== status) {
          await updateLead(lead.id, { status });
          lead.status = status;
          leadsUpdated++;
        }
      } else {
        // Create new lead
        const newLead: Omit<Lead, 'id'> = {
          name: instagramName,
          phone: '',
          product: 'Интерес из Instagram',
          managerId: 'm1', // Default to admin
          status: status,
          source: 'instagram',
          instagramAccount: instagramName,
          fulfillmentMethod: 'delivery',
          createdAt: new Date().toISOString(),
          additionalInfo: `IG Conversation ID: ${conversationId}`
        };
        const createdLead = await createLead(newLead);
        existingLeads.push(createdLead);
        leadsCreated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      leadsCreated, 
      leadsUpdated,
      totalConversations: conversations.length 
    });

  } catch (error: any) {
    console.error('[IG CRM Sync Error]', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
