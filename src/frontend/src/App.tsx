import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  FileText,
  Loader2,
  Pencil,
  PlusCircle,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  type RecordData,
  Remark,
  useCreateRecord,
  useDeleteRecord,
  useGetAllRecords,
  useUpdateRecord,
} from "./hooks/useQueries";

const EMPTY_FORM = {
  finance: "",
  customerName: "",
  mcf: "",
  product: "",
  grossAmount: "",
  netAmount: "",
  loanAmount: "",
  brokerageAmountReceivedDate: "",
  bankAmountReceivedDate: "",
  remark: "" as Remark | "",
};

type FormState = typeof EMPTY_FORM;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("add");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingSerial, setEditingSerial] = useState<bigint | null>(null);
  const [filterRemark, setFilterRemark] = useState<
    "all" | "received" | "pending"
  >("all");
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const { data: records = [], isLoading } = useGetAllRecords();
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();

  const nextSerial =
    records.length > 0
      ? Math.max(...records.map((r) => Number(r.serialNumber))) + 1
      : 1;

  const filteredRecords = records.filter((r) => {
    if (filterRemark === "all") return true;
    return r.remark === filterRemark;
  });

  const sortedRecords = [...filteredRecords].sort(
    (a, b) => Number(a.serialNumber) - Number(b.serialNumber),
  );

  function handleFormChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function clearForm() {
    setForm(EMPTY_FORM);
    setEditingSerial(null);
  }

  async function handleSave() {
    if (!form.finance.trim() || !form.customerName.trim()) {
      toast.error("Finance and Customer Name are required.");
      return;
    }
    if (!form.remark) {
      toast.error("Please select a remark status.");
      return;
    }

    const payload = {
      finance: form.finance.trim(),
      customerName: form.customerName.trim(),
      mcf: form.mcf.trim(),
      product: form.product.trim(),
      grossAmount: Number.parseFloat(form.grossAmount) || 0,
      netAmount: Number.parseFloat(form.netAmount) || 0,
      loanAmount: form.loanAmount ? Number.parseFloat(form.loanAmount) : null,
      brokerageAmountReceivedDate: form.brokerageAmountReceivedDate || null,
      bankAmountReceivedDate: form.bankAmountReceivedDate || null,
      remark: form.remark as Remark,
    };

    try {
      if (editingSerial !== null) {
        await updateRecord.mutateAsync({
          serialNumber: editingSerial,
          ...payload,
        });
        toast.success("Record updated successfully.");
      } else {
        await createRecord.mutateAsync(payload);
        toast.success("Record saved successfully.");
      }
      clearForm();
      setActiveTab("records");
    } catch {
      toast.error("Failed to save record. Please try again.");
    }
  }

  function handleEdit(record: RecordData) {
    setForm({
      finance: record.finance,
      customerName: record.customerName,
      mcf: record.mcf,
      product: record.product,
      grossAmount: String(record.grossAmount),
      netAmount: String(record.netAmount),
      loanAmount: record.loanAmount != null ? String(record.loanAmount) : "",
      brokerageAmountReceivedDate: record.brokerageAmountReceivedDate ?? "",
      bankAmountReceivedDate: record.bankAmountReceivedDate ?? "",
      remark: record.remark,
    });
    setEditingSerial(record.serialNumber);
    setActiveTab("add");
  }

  async function handleDelete(serialNumber: bigint) {
    try {
      await deleteRecord.mutateAsync(serialNumber);
      toast.success("Record deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete record.");
    }
  }

  function printSingleRecord() {
    if (!form.finance && !form.customerName) {
      toast.error("No data to print.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const sn =
      editingSerial !== null ? String(editingSerial) : `${nextSerial} (New)`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Urban Money Brokerage - Record</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
    .header { text-align: center; border-bottom: 3px solid #1a2744; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #1a2744; letter-spacing: 2px; text-transform: uppercase; }
    .header p { margin: 4px 0 0; font-size: 11px; color: #666; letter-spacing: 4px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .badge-received { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .record-card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .record-title { font-size: 14px; font-weight: 700; color: #1a2744; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .field { padding: 4px 0; border-bottom: 1px dotted #eee; }
    .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
    .field-value { font-size: 13px; font-weight: 600; color: #111; margin-top: 2px; }
    .footer { margin-top: 24px; font-size: 9px; color: #aaa; text-align: right; border-top: 1px solid #eee; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Urban Money Brokerage</h1>
    <p>Financial Records Management System</p>
  </div>
  <div class="record-card">
    <div class="record-title">Brokerage Record — Serial No. ${sn}</div>
    <div class="grid">
      <div class="field"><div class="field-label">Finance</div><div class="field-value">${form.finance || "—"}</div></div>
      <div class="field"><div class="field-label">Customer Name</div><div class="field-value">${form.customerName || "—"}</div></div>
      <div class="field"><div class="field-label">MCF</div><div class="field-value">${form.mcf || "—"}</div></div>
      <div class="field"><div class="field-label">Product</div><div class="field-value">${form.product || "—"}</div></div>
      <div class="field"><div class="field-label">Gross Amount</div><div class="field-value">${form.grossAmount ? `₹${Number.parseFloat(form.grossAmount).toFixed(2)}` : "—"}</div></div>
      <div class="field"><div class="field-label">Net Amount</div><div class="field-value">${form.netAmount ? `₹${Number.parseFloat(form.netAmount).toFixed(2)}` : "—"}</div></div>
      <div class="field"><div class="field-label">Loan Amount</div><div class="field-value">${form.loanAmount ? `₹${Number.parseFloat(form.loanAmount).toFixed(2)}` : "—"}</div></div>
      <div class="field"><div class="field-label">Brokerage Amt. Received Date</div><div class="field-value">${form.brokerageAmountReceivedDate ? formatDate(form.brokerageAmountReceivedDate) : "—"}</div></div>
      <div class="field"><div class="field-label">Bank Amt. Received Date</div><div class="field-value">${form.bankAmountReceivedDate ? formatDate(form.bankAmountReceivedDate) : "—"}</div></div>
      <div class="field"><div class="field-label">Status / Remark</div><div class="field-value"><span class="badge badge-${form.remark || "pending"}">${form.remark ? form.remark.charAt(0).toUpperCase() + form.remark.slice(1) : "—"}</span></div></div>
    </div>
  </div>
  <div class="footer">Printed on: ${new Date().toLocaleString("en-IN")} | Urban Money Brokerage — Confidential</div>
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  function printAllRecords() {
    const toPrint = sortedRecords;
    if (toPrint.length === 0) {
      toast.error("No records to print.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = toPrint
      .map(
        (r, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f5f7fb"}">
        <td style="text-align:center;font-weight:700">${String(r.serialNumber)}</td>
        <td>${formatDate(r.brokerageAmountReceivedDate) || ""}</td>
        <td>${formatDate(r.bankAmountReceivedDate) || ""}</td>
        <td>${r.finance}</td>
        <td style="font-weight:600">${r.customerName}</td>
        <td>${r.mcf}</td>
        <td>${r.product}</td>
        <td style="text-align:right">${r.loanAmount != null ? `₹${r.loanAmount.toFixed(2)}` : ""}</td>
        <td style="text-align:right">₹${r.grossAmount.toFixed(2)}</td>
        <td style="text-align:right">₹${r.netAmount.toFixed(2)}</td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:${r.remark === "received" ? "#d1fae5" : "#fef3c7"};color:${r.remark === "received" ? "#065f46" : "#92400e"}">
            ${r.remark === "received" ? "Received" : "Pending"}
          </span>
        </td>
      </tr>`,
      )
      .join("");

    const filterLabel =
      filterRemark === "all"
        ? "All Records"
        : filterRemark === "received"
          ? "Received Records"
          : "Pending Records";
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Urban Money Brokerage - All Records</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #111; }
    .header { text-align: center; border-bottom: 3px solid #1a2744; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 20px; color: #1a2744; letter-spacing: 2px; text-transform: uppercase; }
    .header p { margin: 4px 0 0; font-size: 10px; color: #666; letter-spacing: 4px; text-transform: uppercase; }
    .meta { display: flex; justify-content: space-between; font-size: 9px; color: #666; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a2744; color: white; padding: 6px 6px; text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 4px 6px; border: 1px solid #e0e0e0; font-size: 9.5px; }
    .footer { margin-top: 12px; font-size: 8px; color: #aaa; text-align: right; border-top: 1px solid #eee; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Urban Money Brokerage</h1>
    <p>Financial Records Management System</p>
  </div>
  <div class="meta">
    <span>Filter: ${filterLabel} &nbsp;|&nbsp; Total: ${toPrint.length} record${toPrint.length !== 1 ? "s" : ""}</span>
    <span>Printed: ${new Date().toLocaleString("en-IN")}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>S/N</th>
        <th>Brokerage Recd. Date</th>
        <th>Bank Recd. Date</th>
        <th>Finance</th>
        <th>Customer Name</th>
        <th>MCF</th>
        <th>Product</th>
        <th>Loan Amount</th>
        <th>Gross Amount</th>
        <th>Net Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Urban Money Brokerage — Financial Records — Confidential Document</div>
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  const isSaving = createRecord.isPending || updateRecord.isPending;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'General Sans', sans-serif" }}
    >
      {/* ===== HEADER ===== */}
      <header
        className="no-print"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.17 0.05 258) 0%, oklch(0.22 0.055 255) 60%, oklch(0.27 0.06 250) 100%)",
          borderBottom: "3px solid oklch(0.76 0.155 82)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(0.76 0.155 82)",
                boxShadow: "0 4px 16px oklch(0.76 0.155 82 / 0.4)",
              }}
            >
              <Building2
                className="w-8 h-8"
                style={{ color: "oklch(0.17 0.05 258)" }}
              />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black tracking-widest uppercase"
                style={{
                  color: "oklch(0.76 0.155 82)",
                  fontFamily: "'Cabinet Grotesk', sans-serif",
                  letterSpacing: "0.15em",
                }}
              >
                Urban Money Brokerage
              </h1>
              <p
                className="text-xs tracking-[0.3em] uppercase font-medium"
                style={{ color: "oklch(0.72 0.02 255)" }}
              >
                Financial Records Management System
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "oklch(0.6 0.03 255)" }}
            >
              Total Records
            </span>
            <span
              className="text-3xl font-black"
              style={{
                color: "oklch(0.76 0.155 82)",
                fontFamily: "'Cabinet Grotesk', sans-serif",
              }}
            >
              {records.length}
            </span>
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="no-print mb-6 h-12 p-1 rounded-xl"
            style={{
              background: "oklch(0.22 0.055 255)",
              border: "1px solid oklch(0.3 0.06 255)",
            }}
          >
            <TabsTrigger
              value="add"
              data-ocid="tabs.add_tab"
              className="h-10 px-6 rounded-lg text-sm font-semibold tracking-wide transition-all"
              style={{
                color:
                  activeTab === "add"
                    ? "oklch(0.17 0.05 258)"
                    : "oklch(0.7 0.03 255)",
                background:
                  activeTab === "add" ? "oklch(0.76 0.155 82)" : "transparent",
                fontFamily: "'Cabinet Grotesk', sans-serif",
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {editingSerial !== null ? "Edit Record" : "Add New Brokerage"}
            </TabsTrigger>
            <TabsTrigger
              value="records"
              data-ocid="tabs.records_tab"
              className="h-10 px-6 rounded-lg text-sm font-semibold tracking-wide transition-all"
              style={{
                color:
                  activeTab === "records"
                    ? "oklch(0.17 0.05 258)"
                    : "oklch(0.7 0.03 255)",
                background:
                  activeTab === "records"
                    ? "oklch(0.76 0.155 82)"
                    : "transparent",
                fontFamily: "'Cabinet Grotesk', sans-serif",
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              All Records
            </TabsTrigger>
          </TabsList>

          {/* ===== ADD/EDIT TAB ===== */}
          <TabsContent value="add">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.88 0.015 255)",
                boxShadow: "0 4px 24px oklch(0.22 0.055 255 / 0.08)",
              }}
            >
              {/* Form header bar */}
              <div
                className="px-6 py-4"
                style={{ background: "oklch(0.22 0.055 255)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className="text-lg font-black uppercase tracking-widest"
                      style={{
                        color: "oklch(0.76 0.155 82)",
                        fontFamily: "'Cabinet Grotesk', sans-serif",
                      }}
                    >
                      {editingSerial !== null
                        ? `Edit Record — S/N ${String(editingSerial)}`
                        : "New Brokerage Entry"}
                    </h2>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "oklch(0.6 0.03 255)" }}
                    >
                      {editingSerial !== null
                        ? "Modify the record fields and click Update"
                        : "Fill in the details and save the brokerage record"}
                    </p>
                  </div>
                  {editingSerial !== null && (
                    <button
                      type="button"
                      onClick={clearForm}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:opacity-80"
                      style={{
                        background: "oklch(0.3 0.06 255)",
                        color: "oklch(0.76 0.155 82)",
                      }}
                    >
                      <RotateCcw className="w-3 h-3" /> Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Form body */}
              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  {/* Serial Number */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Serial Number
                    </Label>
                    <div
                      className="h-10 px-3 rounded-lg flex items-center text-sm font-bold"
                      style={{
                        background: "oklch(0.95 0.01 255)",
                        border: "1px solid oklch(0.88 0.015 255)",
                        color: "oklch(0.4 0.05 255)",
                      }}
                    >
                      {editingSerial !== null
                        ? `#${String(editingSerial)}`
                        : `Auto-assigned: #${nextSerial}`}
                    </div>
                  </div>

                  {/* Finance */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="finance"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Finance{" "}
                      <span style={{ color: "oklch(0.58 0.22 25)" }}>*</span>
                    </Label>
                    <Input
                      id="finance"
                      data-ocid="form.finance_input"
                      value={form.finance}
                      onChange={(e) =>
                        handleFormChange("finance", e.target.value)
                      }
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="customerName"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Customer Name{" "}
                      <span style={{ color: "oklch(0.58 0.22 25)" }}>*</span>
                    </Label>
                    <Input
                      id="customerName"
                      data-ocid="form.customer_input"
                      value={form.customerName}
                      onChange={(e) =>
                        handleFormChange("customerName", e.target.value)
                      }
                      placeholder="Full name"
                    />
                  </div>

                  {/* MCF */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mcf"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      MCF
                    </Label>
                    <Input
                      id="mcf"
                      data-ocid="form.mcf_input"
                      value={form.mcf}
                      onChange={(e) => handleFormChange("mcf", e.target.value)}
                      placeholder="MCF reference"
                    />
                  </div>

                  {/* Product */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="product"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Product
                    </Label>
                    <Input
                      id="product"
                      data-ocid="form.product_input"
                      value={form.product}
                      onChange={(e) =>
                        handleFormChange("product", e.target.value)
                      }
                      placeholder="e.g. Home Loan"
                    />
                  </div>

                  {/* Gross Amount */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="grossAmount"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Gross Amount (₹)
                    </Label>
                    <Input
                      id="grossAmount"
                      data-ocid="form.gross_amount_input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.grossAmount}
                      onChange={(e) =>
                        handleFormChange("grossAmount", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  {/* Net Amount */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="netAmount"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Net Amount (₹)
                    </Label>
                    <Input
                      id="netAmount"
                      data-ocid="form.net_amount_input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.netAmount}
                      onChange={(e) =>
                        handleFormChange("netAmount", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  {/* Loan Amount */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="loanAmount"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Loan Amount (₹)
                      <span
                        className="ml-1 font-normal normal-case tracking-normal"
                        style={{ color: "oklch(0.6 0.02 255)" }}
                      >
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="loanAmount"
                      data-ocid="form.loan_amount_input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.loanAmount}
                      onChange={(e) =>
                        handleFormChange("loanAmount", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  {/* Brokerage Amt. Received Date */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="brokerageDate"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Brokerage Amt. Received Date
                      <span
                        className="ml-1 font-normal normal-case tracking-normal"
                        style={{ color: "oklch(0.6 0.02 255)" }}
                      >
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="brokerageDate"
                      data-ocid="form.brokerage_date_input"
                      type="date"
                      value={form.brokerageAmountReceivedDate}
                      onChange={(e) =>
                        handleFormChange(
                          "brokerageAmountReceivedDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  {/* Bank Amt. Received Date */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="bankDate"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Bank Amt. Received Date
                      <span
                        className="ml-1 font-normal normal-case tracking-normal"
                        style={{ color: "oklch(0.6 0.02 255)" }}
                      >
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="bankDate"
                      data-ocid="form.bank_date_input"
                      type="date"
                      value={form.bankAmountReceivedDate}
                      onChange={(e) =>
                        handleFormChange(
                          "bankAmountReceivedDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  {/* Remark */}
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "oklch(0.45 0.04 255)" }}
                    >
                      Remark / Status{" "}
                      <span style={{ color: "oklch(0.58 0.22 25)" }}>*</span>
                    </Label>
                    <Select
                      value={form.remark}
                      onValueChange={(v) => handleFormChange("remark", v)}
                    >
                      <SelectTrigger data-ocid="form.remark_select">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Remark.received}>
                          ✅ Received
                        </SelectItem>
                        <SelectItem value={Remark.pending}>
                          ⏳ Pending
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action buttons */}
                <div
                  className="mt-8 flex flex-wrap items-center gap-3 pt-5"
                  style={{ borderTop: "1px solid oklch(0.9 0.01 255)" }}
                >
                  <Button
                    variant="outline"
                    data-ocid="form.clear_button"
                    onClick={clearForm}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Clear
                  </Button>
                  <Button
                    variant="outline"
                    data-ocid="form.print_button"
                    onClick={printSingleRecord}
                    className="gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print Entry
                  </Button>
                  <div className="flex-1" />
                  <Button
                    data-ocid="form.save_button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 px-8 font-bold tracking-wide"
                    style={{
                      background: "oklch(0.22 0.055 255)",
                      color: "oklch(0.76 0.155 82)",
                      border: "1px solid oklch(0.76 0.155 82 / 0.3)",
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : editingSerial !== null ? (
                      <>
                        <Pencil className="w-4 h-4" /> Update Record
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" /> Save Record
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== ALL RECORDS TAB ===== */}
          <TabsContent value="records">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.88 0.015 255)",
                boxShadow: "0 4px 24px oklch(0.22 0.055 255 / 0.08)",
              }}
            >
              {/* Records header */}
              <div
                className="px-6 py-4 no-print"
                style={{ background: "oklch(0.22 0.055 255)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2
                      className="text-lg font-black uppercase tracking-widest"
                      style={{
                        color: "oklch(0.76 0.155 82)",
                        fontFamily: "'Cabinet Grotesk', sans-serif",
                      }}
                    >
                      All Brokerage Records
                    </h2>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "oklch(0.6 0.03 255)" }}
                    >
                      {filteredRecords.length} of {records.length} record
                      {records.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label
                        className="text-xs uppercase tracking-widest"
                        style={{ color: "oklch(0.6 0.03 255)" }}
                      >
                        Filter:
                      </Label>
                      <Select
                        value={filterRemark}
                        onValueChange={(v) =>
                          setFilterRemark(v as "all" | "received" | "pending")
                        }
                      >
                        <SelectTrigger
                          data-ocid="records.filter_select"
                          className="w-36 h-9 text-sm"
                          style={{
                            background: "oklch(0.3 0.06 255)",
                            borderColor: "oklch(0.4 0.06 255)",
                            color: "white",
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Records</SelectItem>
                          <SelectItem value="received">✅ Received</SelectItem>
                          <SelectItem value="pending">⏳ Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      onClick={printAllRecords}
                      className="gap-2 h-9 px-4 text-sm font-semibold"
                      style={{
                        background: "oklch(0.76 0.155 82)",
                        color: "oklch(0.17 0.05 258)",
                      }}
                    >
                      <Printer className="w-4 h-4" /> Print All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white overflow-x-auto" ref={printAreaRef}>
                {isLoading ? (
                  <div
                    className="flex items-center justify-center py-20"
                    data-ocid="records.loading_state"
                  >
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.22 0.055 255)" }}
                    />
                    <span
                      className="ml-3 text-sm"
                      style={{ color: "oklch(0.5 0.03 255)" }}
                    >
                      Loading records...
                    </span>
                  </div>
                ) : sortedRecords.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-20 gap-4"
                    data-ocid="records.empty_state"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "oklch(0.95 0.01 255)" }}
                    >
                      <FileText
                        className="w-8 h-8"
                        style={{ color: "oklch(0.7 0.03 255)" }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        className="font-semibold"
                        style={{ color: "oklch(0.35 0.04 255)" }}
                      >
                        No records found
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "oklch(0.6 0.02 255)" }}
                      >
                        {filterRemark !== "all"
                          ? "Try changing the filter."
                          : "Add a new brokerage entry to get started."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: "oklch(0.95 0.015 255)" }}>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 50,
                          }}
                        >
                          S/N
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 130,
                          }}
                        >
                          Brokerage Recd. Date
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 120,
                          }}
                        >
                          Bank Recd. Date
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 120,
                          }}
                        >
                          Finance
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 150,
                          }}
                        >
                          Customer Name
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 90,
                          }}
                        >
                          MCF
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 100,
                          }}
                        >
                          Product
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-right"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 110,
                          }}
                        >
                          Loan Amount
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-right"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 110,
                          }}
                        >
                          Gross Amt.
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-right"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 110,
                          }}
                        >
                          Net Amt.
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-center"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 100,
                          }}
                        >
                          Remark
                        </TableHead>
                        <TableHead
                          className="text-xs font-bold uppercase tracking-wider whitespace-nowrap text-center no-print"
                          style={{
                            color: "oklch(0.22 0.055 255)",
                            minWidth: 100,
                          }}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRecords.map((record, index) => (
                        <TableRow
                          key={String(record.serialNumber)}
                          data-ocid={`records.row.${index + 1}`}
                          className="hover:bg-slate-50 transition-colors"
                          style={{
                            borderBottom: "1px solid oklch(0.93 0.01 255)",
                          }}
                        >
                          <TableCell
                            className="font-black text-center"
                            style={{ color: "oklch(0.22 0.055 255)" }}
                          >
                            #{String(record.serialNumber)}
                          </TableCell>
                          <TableCell
                            className="text-sm"
                            style={{ color: "oklch(0.35 0.03 255)" }}
                          >
                            {formatDate(record.brokerageAmountReceivedDate) || (
                              <span style={{ color: "oklch(0.75 0.01 255)" }}>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-sm"
                            style={{ color: "oklch(0.35 0.03 255)" }}
                          >
                            {formatDate(record.bankAmountReceivedDate) || (
                              <span style={{ color: "oklch(0.75 0.01 255)" }}>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-sm font-medium"
                            style={{ color: "oklch(0.25 0.04 255)" }}
                          >
                            {record.finance}
                          </TableCell>
                          <TableCell
                            className="font-semibold"
                            style={{ color: "oklch(0.22 0.055 255)" }}
                          >
                            {record.customerName}
                          </TableCell>
                          <TableCell
                            className="text-sm"
                            style={{ color: "oklch(0.35 0.03 255)" }}
                          >
                            {record.mcf || (
                              <span style={{ color: "oklch(0.75 0.01 255)" }}>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-sm"
                            style={{ color: "oklch(0.35 0.03 255)" }}
                          >
                            {record.product || (
                              <span style={{ color: "oklch(0.75 0.01 255)" }}>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-sm text-right font-mono"
                            style={{ color: "oklch(0.3 0.05 255)" }}
                          >
                            {record.loanAmount != null ? (
                              formatCurrency(record.loanAmount)
                            ) : (
                              <span style={{ color: "oklch(0.75 0.01 255)" }}>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-sm text-right font-mono"
                            style={{ color: "oklch(0.3 0.05 255)" }}
                          >
                            {formatCurrency(record.grossAmount)}
                          </TableCell>
                          <TableCell
                            className="text-sm text-right font-mono font-semibold"
                            style={{ color: "oklch(0.22 0.055 255)" }}
                          >
                            {formatCurrency(record.netAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5"
                              style={
                                record.remark === Remark.received
                                  ? {
                                      background: "oklch(0.93 0.08 145)",
                                      color: "oklch(0.35 0.15 145)",
                                      border: "1px solid oklch(0.8 0.1 145)",
                                    }
                                  : {
                                      background: "oklch(0.95 0.09 85)",
                                      color: "oklch(0.5 0.15 82)",
                                      border: "1px solid oklch(0.85 0.12 82)",
                                    }
                              }
                            >
                              {record.remark === Remark.received
                                ? "Received"
                                : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="no-print">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                data-ocid={`records.edit_button.${index + 1}`}
                                onClick={() => handleEdit(record)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                                style={{
                                  background: "oklch(0.93 0.04 255)",
                                  color: "oklch(0.3 0.07 255)",
                                }}
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                data-ocid={`records.delete_button.${index + 1}`}
                                onClick={() =>
                                  setDeleteTarget(record.serialNumber)
                                }
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                                style={{
                                  background: "oklch(0.95 0.05 25)",
                                  color: "oklch(0.5 0.2 25)",
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Summary footer */}
              {sortedRecords.length > 0 && (
                <div
                  className="px-6 py-3 flex flex-wrap gap-4 no-print"
                  style={{
                    background: "oklch(0.97 0.008 255)",
                    borderTop: "1px solid oklch(0.9 0.01 255)",
                  }}
                >
                  <div
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.03 255)" }}
                  >
                    <span
                      className="font-semibold"
                      style={{ color: "oklch(0.22 0.055 255)" }}
                    >
                      Total Gross:
                    </span>{" "}
                    {formatCurrency(
                      sortedRecords.reduce((s, r) => s + r.grossAmount, 0),
                    )}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.03 255)" }}
                  >
                    <span
                      className="font-semibold"
                      style={{ color: "oklch(0.22 0.055 255)" }}
                    >
                      Total Net:
                    </span>{" "}
                    {formatCurrency(
                      sortedRecords.reduce((s, r) => s + r.netAmount, 0),
                    )}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.03 255)" }}
                  >
                    <span
                      className="font-semibold"
                      style={{ color: "oklch(0.22 0.055 255)" }}
                    >
                      Total Loan:
                    </span>{" "}
                    {formatCurrency(
                      sortedRecords.reduce(
                        (s, r) => s + (r.loanAmount ?? 0),
                        0,
                      ),
                    )}
                  </div>
                  <div className="flex-1" />
                  <div
                    className="text-xs"
                    style={{ color: "oklch(0.5 0.03 255)" }}
                  >
                    <Badge
                      className="mr-1 text-xs"
                      style={{
                        background: "oklch(0.93 0.08 145)",
                        color: "oklch(0.35 0.15 145)",
                      }}
                    >
                      {
                        records.filter((r) => r.remark === Remark.received)
                          .length
                      }{" "}
                      Received
                    </Badge>
                    <Badge
                      className="text-xs"
                      style={{
                        background: "oklch(0.95 0.09 85)",
                        color: "oklch(0.5 0.15 82)",
                      }}
                    >
                      {
                        records.filter((r) => r.remark === Remark.pending)
                          .length
                      }{" "}
                      Pending
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== FOOTER ===== */}
      <footer
        className="no-print mt-auto py-4 text-center text-xs"
        style={{
          color: "oklch(0.6 0.02 255)",
          borderTop: "1px solid oklch(0.9 0.01 255)",
        }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
          style={{ color: "oklch(0.5 0.05 255)" }}
        >
          caffeine.ai
        </a>
      </footer>

      {/* ===== DELETE CONFIRM DIALOG ===== */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent data-ocid="records.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete record #
              {deleteTarget !== null ? String(deleteTarget) : ""}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="records.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="records.confirm_button"
              onClick={() =>
                deleteTarget !== null && handleDelete(deleteTarget)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRecord.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster richColors position="top-right" />
    </div>
  );
}
