'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Phone, Clock, Package } from 'lucide-react';
import type { Lead } from '@/lib/crm/types';

interface DeliveriesTodayProps {
  managerId: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function isWithinTwoHours(iso: string): boolean {
  const diff = new Date(iso).getTime() - Date.now();
  return diff >= 0 && diff <= 2 * 60 * 60 * 1000;
}

export default function DeliveriesToday({ managerId: _managerId }: DeliveriesTodayProps) {
  const [deliveries, setDeliveries] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        const allLeads: Lead[] = Array.isArray(data) ? data : (data.leads ?? []);
        const today = new Date().toISOString().slice(0, 10);
        const filtered = allLeads
          .filter(l => l.fulfillmentMethod === 'delivery' && (l as any).deliveryDateTime?.startsWith(today))
          .sort((a, b) => new Date((a as any).deliveryDateTime!).getTime() - new Date((b as any).deliveryDateTime!).getTime());
        setDeliveries(filtered);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
        <Package size={14} className="animate-pulse" />
        Загрузка...
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
        <Package size={14} />
        Нет доставок на сегодня
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveries.map(lead => {
        const urgent = lead.deliveryDateTime ? isWithinTwoHours(lead.deliveryDateTime) : false;
        return (
          <div
            key={lead.id}
            className={`bg-gray-800 rounded-lg p-3 space-y-2 border ${
              urgent ? 'border-amber-500' : 'border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium text-white">{lead.name}</div>
              {urgent && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 font-medium whitespace-nowrap">
                  Скоро
                </span>
              )}
            </div>

            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Phone size={11} />
                <span className="text-gray-300">{lead.phone}</span>
              </div>
              {lead.deliveryDateTime && (
                <div className="flex items-center gap-1.5">
                  <Clock size={11} />
                  <span className={urgent ? 'text-amber-400 font-medium' : 'text-gray-300'}>
                    {formatDateTime(lead.deliveryDateTime)}
                  </span>
                </div>
              )}
              {lead.deliveryAddress && (
                <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="mt-0.5 shrink-0" />
                  <span className="text-gray-300">{lead.deliveryAddress}</span>
                </div>
              )}
              {((lead as any).courierName || (lead as any).courierCarNumber || (lead as any).deliveryStatus) && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(lead as any).deliveryStatus && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 font-medium">
                      {(lead as any).deliveryStatus === 'in_transit' ? '🚚 В пути' :
                       (lead as any).deliveryStatus === 'delivered' ? '✅ Доставлено' :
                       (lead as any).deliveryStatus === 'failed' ? '❌ Не доставлено' :
                       (lead as any).deliveryStatus === 'returned' ? '↩️ Возврат' : '⏳ Ожидает'}
                    </span>
                  )}
                  {(lead as any).courierName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      👤 {(lead as any).courierName}
                    </span>
                  )}
                  {(lead as any).courierCarNumber && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      🚗 {(lead as any).courierCarNumber}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
