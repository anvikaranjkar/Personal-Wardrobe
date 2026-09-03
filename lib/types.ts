export type CategoryKind = "category" | "tag";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  kind: CategoryKind;
  is_system: boolean;
  created_at: string;
};

export type ClothingItem = {
  id: string;
  user_id: string;
  name: string;
  category_id: string;
  image_url: string;
  tags: string[];
  created_at: string;
  category?: Pick<Category, "name" | "slug"> | null;
  signed_url?: string;
};

export type Outfit = {
  id: string;
  user_id: string;
  name: string;
  top_id: string | null;
  bottom_id: string | null;
  shoes_id: string | null;
  created_at: string;
};

export const DEFAULT_CATEGORY_NAMES = [
  "Headwear",
  "Top",
  "Outerwear",
  "Bottom",
  "Shoes",
  "Accessories",
] as const;
