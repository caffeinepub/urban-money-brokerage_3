import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecordData } from "../backend.d";
import { Remark } from "../backend.d";
import { useActor } from "./useActor";

export type { RecordData };
export { Remark };

export function useGetAllRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<RecordData[]>({
    queryKey: ["records"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      finance: string;
      customerName: string;
      mcf: string;
      product: string;
      grossAmount: number;
      netAmount: number;
      loanAmount: number | null;
      brokerageAmountReceivedDate: string | null;
      bankAmountReceivedDate: string | null;
      remark: Remark;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createRecord(
        data.finance,
        data.customerName,
        data.mcf,
        data.product,
        data.grossAmount,
        data.netAmount,
        data.loanAmount,
        data.brokerageAmountReceivedDate,
        data.bankAmountReceivedDate,
        data.remark,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useUpdateRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      serialNumber: bigint;
      finance: string;
      customerName: string;
      mcf: string;
      product: string;
      grossAmount: number;
      netAmount: number;
      loanAmount: number | null;
      brokerageAmountReceivedDate: string | null;
      bankAmountReceivedDate: string | null;
      remark: Remark;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateRecord(
        data.serialNumber,
        data.finance,
        data.customerName,
        data.mcf,
        data.product,
        data.grossAmount,
        data.netAmount,
        data.loanAmount,
        data.brokerageAmountReceivedDate,
        data.bankAmountReceivedDate,
        data.remark,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useDeleteRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumber: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteRecord(serialNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}
