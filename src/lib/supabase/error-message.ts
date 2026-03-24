const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function getSupabaseHost() {
  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).host;
  } catch {
    return supabaseUrl;
  }
}

export function getReadableSupabaseError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      const host = getSupabaseHost();

      return host
        ? `Could not reach Supabase at ${host}. Check your internet connection, confirm the Supabase project is active, and restart the dev server after any .env.local changes.`
        : "Could not reach Supabase. Check your internet connection and verify your .env.local values.";
    }

    return error.message;
  }

  return "Something went wrong while contacting Supabase.";
}
