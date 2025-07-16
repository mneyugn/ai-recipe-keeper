import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

async function cleanupDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const userId = process.env.E2E_USER_ID;

  if (!supabaseUrl || !supabaseKey || !userId) {
    throw new Error("Brakujące zmienne środowiskowe: SUPABASE_URL, SUPABASE_KEY lub E2E_USER_ID");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Usuń wszystkie przepisy testowe
  const { error } = await supabase.from("recipes").delete().eq("user_id", userId);

  if (error) {
    console.error("Błąd podczas czyszczenia bazy danych:", error.message);
    throw error;
  }

  //   console.log("Baza danych została wyczyszczona pomyślnie");
}

async function globalTeardown() {
  //  console.log("Rozpoczynam czyszczenie bazy danych...");
  await cleanupDatabase();
  //   console.log("Zakończono czyszczenie bazy danych");
}

export default globalTeardown;
