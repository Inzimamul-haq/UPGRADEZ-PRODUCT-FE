import { useState } from 'react';
import api from '@/lib/api';
import { StepExplanation } from '@/lib/types';

export function useStepDoubt(chatId?: string, messageId?: string, batchQuestionNo?: number | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDoubt = async (
    stepNumber: number | string,
    stepContent: string,
    doubtText: string
  ): Promise<StepExplanation | null> => {
    if (!chatId || !messageId) {
      setError('Missing chatId or messageId');
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(
        `/api/chats/${chatId}/messages/${messageId}/step-doubt`,
        { stepNumber, stepContent, doubtText, batchQuestionNo }
      );
      setLoading(false);
      return res.data.data as StepExplanation;
    } catch (e: any) {
      setLoading(false);
      setError(e.response?.data?.message || e.message || 'Failed to submit doubt');
      return null;
    }
  };

  return { submitDoubt, loading, error };
}
