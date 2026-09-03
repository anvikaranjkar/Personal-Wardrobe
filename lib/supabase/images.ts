import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClothingItem } from "@/lib/types";

export async function signItemImages(client: SupabaseClient, items: ClothingItem[]) {
  return Promise.all(
    items.map(async (item) => {
      const { data } = await client.storage
        .from("clothing-items")
        .createSignedUrl(item.image_url, 60 * 60);

      return { ...item, signed_url: data?.signedUrl };
    }),
  );
}
