import { supabase } from "@/lib/supabaseClient";

export async function fetchStaffOnboardingSummary(userId: number) {
  try {
    const [bankRes, aadhaarRes, panRes] = await Promise.all([
      supabase
        .from("staff_bank_details")
        .select("bankName, accountNumber, ifscCode, accountHolderName, branch")
        .eq("userId", userId)
        .eq("isActive", true)
        .eq("isPrimary", true)
        .maybeSingle(),
      supabase
        .from("staff_aadhaar_details")
        .select(
          "aadhaarNumber, dateOfBirth, address, enrollmentNumber, nameOnAadhaar",
        )
        .eq("userId", userId)
        .maybeSingle(),
      supabase
        .from("staff_pan_details")
        .select("panNumber, dateOfBirth, nameOnPan, fatherName")
        .eq("userId", userId)
        .maybeSingle(),
    ]);

    return {
      bank: bankRes.data || null,
      aadhaar: aadhaarRes.data || null,
      pan: panRes.data || null,
    };
  } catch (error) {
    console.error("Error fetching onboarding summary:", error);
    return { bank: null, aadhaar: null, pan: null };
  }
}
