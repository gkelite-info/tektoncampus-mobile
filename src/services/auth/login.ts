import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getSubdomainFromHost(host?: string) {
  let subdomain = "GKELITE";

  if (!host) return subdomain;

  const cleanHost = host.replace(":3000", "");
  const parts = cleanHost.split(".");

  const isLocalhost = cleanHost.includes("localhost");
  const isRootDomain =
    cleanHost === "tektoncampus.com" ||
    cleanHost === "www.tektoncampus.com" ||
    cleanHost === "localhost";

  if (!isRootDomain) {
    if (isLocalhost) {
      if (parts.length >= 2 && parts[0] !== "localhost") {
        subdomain = parts[0];
      }
    } else {
      if (parts.length >= 3 && parts[0] !== "www") {
        subdomain = parts[0];
      }
    }
  }

  if (
    cleanHost === "tektoncampus.com" ||
    cleanHost === "www.tektoncampus.com"
  ) {
    subdomain = "GKELITE";
  }

  return subdomain;
}

export async function loginUser(
  email: string,
  password: string,
  host?: string
) {
  try {
    const subdomain = getSubdomainFromHost(host);

    const { data: currentPortal, error: portalError } = await supabase
      .from("colleges")
      .select("collegeId")
      .ilike("collegeCode", subdomain)
      .maybeSingle();

    if (portalError || !currentPortal) {
      return {
        success: false,
        error: `Portal for "${subdomain}" is not registered.`,
      };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("userId, fullName, role, collegeId, isActive")
      .eq("auth_id", authData.user.id)
      .maybeSingle();

    if (!userProfile || profileError) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "User profile not found.",
      };
    }

    if (
      Number(userProfile.collegeId) !==
      Number(currentPortal.collegeId)
    ) {
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "Access Denied: You are not authorized for this specific college portal.",
      };
    }

    if (!userProfile.isActive) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Your account is inactive.",
      };
    }

    if (
      userProfile.role === "WellbeingExecutive" ||
      userProfile.role === "WellbeingManager"
    ) {
      const wellbeingRoleType =
        userProfile.role === "WellbeingManager"
          ? "wellbeingManager"
          : "wellbeingExecutive";

      const { data: wellbeingAccess, error: wellbeingError } =
        await supabase
          .from("well_beings")
          .select("wellBeingId")
          .eq("userId", userProfile.userId)
          .eq("collegeId", userProfile.collegeId)
          .eq("roleType", wellbeingRoleType)
          .eq("isActive", true)
          .eq("is_deleted", false)
          .is("deletedAt", null)
          .limit(1);

      if (wellbeingError || !wellbeingAccess?.length) {
        await supabase.auth.signOut();
        return {
          success: false,
          error:
            "Access denied: your wellbeing assignment is inactive.",
        };
      }
    }

    return {
      success: true,
      session: authData.session,
      user: userProfile,
    };
  } catch (err) {
    console.error("Login Error:", err);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}