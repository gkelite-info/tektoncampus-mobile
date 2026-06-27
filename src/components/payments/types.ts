export interface FeeComponent {
  label: string;
  amount: number;
}

export interface SemesterRoadmapItem {
  semesterId: number;
  semesterNumber: number;
  localSemesterName: string;
  academicYearName: string;
  requiredAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
  isCurrent: boolean;
}

export interface FeePlan {
  studentFeeObligationId: number;
  collegeSemesterId: number;
  programName: string;
  type: string;
  academicYear: string;
  openingBalance: number;
  components: FeeComponent[];
  gstAmount: number;
  gstPercent: number;
  applicableFees: number;
  scholarship: number;

  totalPayable: number;
  paidTillNow: number;
  pendingAmount: number;

  semesterTotalPayable?: number;
  semesterPaidTillNow?: number;
  semesterPendingAmount?: number;
  semesterRoadmap?: SemesterRoadmapItem[];
}

export interface ExtendedFeePlan extends FeePlan {}

export type StripePaymentStatus = "succeeded" | "failed" | "processing" | string;

export interface FeeSummaryItem {
  id: number;
  paidAmount: number;
  paymentMode: string;
  entity: string;
  paidOn: string;
  status: StripePaymentStatus;
  comments: string;
  paymentType?: string | null;
  proof?: string | null;
  notes?: string | null;
  collectedBy?: number | null;
  initiatedBy?: string | null;
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  semesterId?: number;
}

export interface NonFinancialDue {
  id: string | number;
  department: string;
  category: string;
  dueDate: string;
  status: "Pending" | "Cleared";
  remarks: string;
}

export interface FinancialDue {
  id: string | number;
  amount: number;
  penaltyAmount: number;
  waiverAmount: number;
  totalPayable: number;
  paidAmount: number;
  pendingAmount: number;
  department: string;
  category: string;
  status: string;
  paymentGateway: string;
  remarks: string;
}

export interface ExcessDue {
  id: string | number;
  department: string;
  category: string;
  amount: number;
}

export interface Transaction {
  id: number | string;
  items: string;
  qty: number;
  costCenter: string;
  amount: number;
  message: string;
  gateway: string;
  trxnId: string;
  paidOn: string;
  status: "Success" | "Failure" | "Pending";
}
