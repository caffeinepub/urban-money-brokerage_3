import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RecordData {
    mcf: string;
    remark: Remark;
    customerName: string;
    netAmount: number;
    finance: string;
    loanAmount?: number;
    grossAmount: number;
    bankAmountReceivedDate?: string;
    brokerageAmountReceivedDate?: string;
    serialNumber: bigint;
    product: string;
}
export enum Remark {
    pending = "pending",
    received = "received"
}
export interface backendInterface {
    createRecord(finance: string, customerName: string, mcf: string, product: string, grossAmount: number, netAmount: number, loanAmount: number | null, brokerageAmountReceivedDate: string | null, bankAmountReceivedDate: string | null, remark: Remark): Promise<bigint>;
    deleteRecord(serialNumber: bigint): Promise<void>;
    getAllRecords(): Promise<Array<RecordData>>;
    getRecord(serialNumber: bigint): Promise<RecordData>;
    updateRecord(serialNumber: bigint, finance: string, customerName: string, mcf: string, product: string, grossAmount: number, netAmount: number, loanAmount: number | null, brokerageAmountReceivedDate: string | null, bankAmountReceivedDate: string | null, remark: Remark): Promise<void>;
}
