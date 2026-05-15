import { useCallback, useState } from "react";

import {
  aiApi,
  type CashFlowInsight,
  type InvoiceAnalysis,
  type PaymentReminder,
} from "@/lib/api/ai";
import { getApiErrorMessage } from "@/lib/apiErrors";

export function useInvoiceAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (invoiceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await aiApi.analyzeInvoice(invoiceId);
      setResult(analysis);
      return analysis;
    } catch (err) {
      setError(getApiErrorMessage(err, "Analysis failed"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, error, loading, result };
}

export function useCashFlowInsights() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CashFlowInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const insights = await aiApi.getCashFlowInsights();
      setData(insights);
      return insights;
    } catch (err) {
      setError(getApiErrorMessage(err, "AI insights failed"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, fetch: fetchInsights, loading };
}

export function usePaymentReminder() {
  const [loading, setLoading] = useState(false);
  const [reminder, setReminder] = useState<PaymentReminder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (invoiceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const nextReminder = await aiApi.generatePaymentReminder(invoiceId);
      setReminder(nextReminder);
      return nextReminder;
    } catch (err) {
      setError(getApiErrorMessage(err, "Reminder generation failed"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { error, generate, loading, reminder };
}
