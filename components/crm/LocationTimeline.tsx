'use client';

import { MapPin, ArrowRight, User, Clock, MessageSquare } from 'lucide-react';
import type { LocationTrackingEntry, Branch, Manager } from '@/lib/crm/types';

interface LocationTimelineProps {
  entries: LocationTrackingEntry[];
  branches?: Branch[];
  managers?: Manager[];
}

function resolveBranchName(branchId: string | undefined, branches?: Branch[]): string {
  if (!branchId) return '—';
  return branches?.find(b => b.branchId === branchId)?.name ?? branchId;
}

function resolveManagerName(managerId: string | undefined, managers?: Manager[]): string {
  if (!managerId) return '—';
  return managers?.find(m => m.id === managerId)?.name ?? managerId;
}

function formatLocation(loc: LocationTrackingEntry['previousLocation'], branches?: Branch[]): string {
  const parts: string[] = [];
  if (loc.branchId) parts.push(resolveBranchName(loc.branchId, branches));
  if (loc.holderName) parts.push(loc.holderName);
  if (loc.warehouseId) parts.push(`Склад: ${loc.warehouseId}`);
  return parts.length > 0 ? parts.join(' / ') : '—';
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function LocationTimeline({ entries, branches, managers }: LocationTimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">
        История перемещений пуста
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative pl-4">
      {sorted.map((entry, idx) => (
        <div key={idx} className="relative mb-6 last:mb-0">
          {/* vertical line */}
          {idx < sorted.length - 1 && (
            <span className="absolute left-[-9px] top-5 bottom-[-24px] w-px bg-gray-700" />
          )}
          {/* dot */}
          <span className="absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-gray-900" />

          <div className="bg-gray-800 rounded-lg p-3 space-y-2">
            {/* timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              {formatTimestamp(entry.timestamp)}
            </div>

            {/* from → to */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="flex items-center gap-1 text-gray-300">
                <MapPin size={13} className="text-gray-500" />
                {formatLocation(entry.previousLocation, branches)}
              </span>
              <ArrowRight size={13} className="text-amber-500 shrink-0" />
              <span className="flex items-center gap-1 text-white font-medium">
                <MapPin size={13} className="text-amber-500" />
                {formatLocation(entry.newLocation, branches)}
              </span>
            </div>

            {/* changed by */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <User size={12} />
              {resolveManagerName(entry.changedBy, managers)}
            </div>

            {/* reason */}
            {entry.changeReason && (
              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <MessageSquare size={12} className="mt-0.5 shrink-0" />
                <span>{entry.changeReason}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
