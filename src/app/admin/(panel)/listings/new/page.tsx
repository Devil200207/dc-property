import { requireAdmin } from "@/lib/auth";
import { filterOptions } from "@/lib/db";
import { ListingForm } from "../ListingForm";

export default async function NewListing() {
  await requireAdmin();
  const { villages } = await filterOptions();
  return <ListingForm villages={villages} />;
}
