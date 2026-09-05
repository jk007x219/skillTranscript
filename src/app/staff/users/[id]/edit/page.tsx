import StaffEditUserPage from "@/components/staff/StaffEditUserPage";

export default async function StaffEditUserRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffEditUserPage userId={id} />;
}