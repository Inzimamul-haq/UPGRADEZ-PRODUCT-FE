"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard } from "lucide-react";

type Usage = {
  id: string;
  month: string;
  tokensUsed: number;
  requestCount: number;
};

export function CollegeUsageTab({ collegeId }: { collegeId: string }) {
  const toast = useToast();
  const [usages, setUsages] = useState<Usage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<{ data: Usage[] }>(`/api/colleges/${collegeId}/usage`);
        setUsages(data.data ?? []);
      } catch {
        toast.error("Failed to load usage data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsage();
  }, [collegeId]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-[#ECECEA]">Usage History</h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="flex-1">Month</div>
          <div className="w-32 text-right">Tokens Used</div>
          <div className="w-32 text-right">API Requests</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading usage data...</p>
        ) : usages.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={CreditCard}
              heading="No usage data yet"
              description="Usage data will appear here when students start using the AI."
            />
          </div>
        ) : (
          usages.map((usage) => (
            <div key={usage.id} className="flex items-center border-t border-[#3A3A38] px-4 py-3">
              <div className="flex-1 text-[14px] text-[#ECECEA]">{usage.month}</div>
              <div className="w-32 text-right text-[13px] text-[#ECECEA] font-mono">
                {new Intl.NumberFormat('en-US').format(Number(usage.tokensUsed))}
              </div>
              <div className="w-32 text-right text-[13px] text-[#8C8C8A]">
                {new Intl.NumberFormat('en-US').format(usage.requestCount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
