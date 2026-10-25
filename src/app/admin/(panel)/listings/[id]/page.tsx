import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { filterOptions, getListing } from "@/lib/db";
import { ListingForm } from "../ListingForm";

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const listing = await getListing(Number((await params).id));
  if (!listing) notFound();
  const { villages } = await filterOptions();
  return <ListingForm listing={listing} villages={villages} />;
}
