import { supabase } from "@/lib/supabaseClient";

export interface EmployeePaySummary {
  totalCTC: number;
  fixedPay: number;
  variablePay: number;
  monthlySalary: number;
  regularSalary: number;
  bonus: number;
  otherAddons: number;
  total: number;
  revisionDate: string;
  allowances: { name: string; amount: number }[];
  compliances: { name: string; amount: number }[];
  leaveAllocations?: any;
  rawAddons?: any;
}

export const fetchEmployeePaySummary = async (
  userId: number,
  collegeId: number,
): Promise<EmployeePaySummary | null> => {
  try {
    const { data, error } = await supabase
      .from("employee_pay_profiles")
      .select(
        `
        updatedAt,
        monthlySalary,
        employee_salary_structure ( totalCtc, fixedPay, variablePay ),
        employee_pay_addons ( addonType, title, amount, payNature ),
        employee_leave_allocations ( totalLeaves, sickLeave, casualLeave, paidLeave ),
        employee_salary_component_values ( amount, salary_component_types ( title ) ),
        employee_payroll_compliance_values ( amount, payroll_compliance_types ( title ) )
      `,
      )
      .eq("userId", userId)
      .eq("collegeId", collegeId)
      .maybeSingle();

    if (error || !data) return null;

    const leaves = Array.isArray(data.employee_leave_allocations)
      ? data.employee_leave_allocations[0]
      : data.employee_leave_allocations;

    const structure = Array.isArray(data.employee_salary_structure)
      ? data.employee_salary_structure[0]
      : data.employee_salary_structure;

    const addons = Array.isArray(data.employee_pay_addons)
      ? data.employee_pay_addons
      : data.employee_pay_addons
        ? [data.employee_pay_addons]
        : [];

    const rawAllowances = Array.isArray(data.employee_salary_component_values)
      ? data.employee_salary_component_values
      : data.employee_salary_component_values
        ? [data.employee_salary_component_values]
        : [];

    const rawCompliances = Array.isArray(
      data.employee_payroll_compliance_values,
    )
      ? data.employee_payroll_compliance_values
      : data.employee_payroll_compliance_values
        ? [data.employee_payroll_compliance_values]
        : [];

    let bonus = 0;
    let otherAddons = 0;

    addons.forEach((a: any) => {
      if (a.addonType === "BONUS") bonus += a.amount;
      else otherAddons += a.amount;
    });

    const fixed = structure?.fixedPay || 0;
    const variable = structure?.variablePay || 0;
    const ctc = structure?.totalCtc || 0;
    const monthly = data.monthlySalary || 0;

    const allowances = rawAllowances.map((a: any) => ({
      name: a.salary_component_types?.title || "Unknown",
      amount: a.amount || 0,
    }));

    const compliances = rawCompliances.map((c: any) => ({
      name: c.payroll_compliance_types?.title || "Unknown",
      amount: c.amount || 0,
    }));

    return {
      totalCTC: ctc,
      fixedPay: fixed,
      variablePay: variable,
      monthlySalary: monthly,
      regularSalary: fixed,
      bonus: bonus,
      otherAddons: otherAddons,
      total: ctc + bonus + otherAddons,
      revisionDate: new Date(data.updatedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      allowances,
      compliances,
      leaveAllocations: leaves || {},
      rawAddons: addons || [],
    };
  } catch (err) {
    console.error("Error fetching pay summary:", err);
    return null;
  }
};
