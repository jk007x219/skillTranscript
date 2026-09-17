import StaffActivitiesPage from "@/components/staff/StaffActivitiesPage";
import ActivityWorkflowPanel from "@/components/staff/ActivityWorkflowPanel";

export default function StaffActivitiesRoutePage() {
  return (
    <>
      <div className="px-4 pt-4 sm:px-6 lg:px-7">
        <ActivityWorkflowPanel />
      </div>
      <StaffActivitiesPage />
    </>
  );
}
