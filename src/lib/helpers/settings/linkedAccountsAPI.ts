import { supabase } from "@/lib/supabaseClient";

export async function syncAndFetchLinkedAccounts(userId: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authIdentities = user?.identities || [];

  const { data: dbAccounts, error } = await supabase
    .from("linked_accounts")
    .select("provider, email, provider_user_id")
    .eq("userId", userId);

  if (error) {
    console.error("Error fetching linked accounts:", error);
    return { syncedProviders: [], updatedDbAccounts: [] };
  }

  const syncedProviders = dbAccounts.map((acc) => acc.provider);
  const updatedDbAccounts = [...dbAccounts];

  for (const identity of authIdentities) {
    if (identity.provider === "email") continue;

    if (!syncedProviders.includes(identity.provider)) {
      const { error: insertError } = await supabase
        .from("linked_accounts")
        .insert({
          userId: userId,
          provider: identity.provider,
          provider_user_id: identity.id,
          email: identity.identity_data?.email || null,
          avatar_url: identity.identity_data?.avatar_url || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (!insertError) {
        syncedProviders.push(identity.provider);
        updatedDbAccounts.push({
          provider: identity.provider,
          email: identity.identity_data?.email,
          provider_user_id: identity.id,
        });
      }
    }
  }

  return { syncedProviders, updatedDbAccounts };
}

export async function unlinkUserIdentity(providerId: string, userId: number) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user || !user.identities)
    throw new Error("Could not fetch user identities.");

  const identityToUnlink = user.identities.find(
    (identity) => identity.provider === providerId,
  );

  if (!identityToUnlink) throw new Error("Account not found in system.");

  const { error: unlinkError } =
    await supabase.auth.unlinkIdentity(identityToUnlink);
  if (unlinkError) throw unlinkError;

  const { error: dbError } = await supabase
    .from("linked_accounts")
    .delete()
    .match({ userId: userId, provider: providerId });

  if (dbError) {
    console.error("Failed to delete from linked_accounts table:", dbError);
  }

  return true;
}

export async function linkUserIdentity(providerId: string, redirectTo: string) {
  const { error } = await supabase.auth.linkIdentity({
    provider: providerId as any,
    options: {
      redirectTo: redirectTo,
    },
  });

  if (error) throw error;
  return true;
}
