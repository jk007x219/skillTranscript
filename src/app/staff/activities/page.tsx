import StaffActivitiesPage from "@/components/staff/StaffActivitiesPage";
import ActivityWorkflowPanel from "@/components/staff/ActivityWorkflowPanel";

export default function StaffActivitiesRoutePage() {
  return (
    <>
      <div className="px-4 pt-4 sm:px-6 lg:px-7">
        <ActivityWorkflowPanel />
      </div>
      <div className="staff-legacy-activity-page">
        <StaffActivitiesPage />
      </div>
      <style jsx global>{`
        @media (min-width: 1024px) {
          .staff-legacy-activity-page article.grid {
            grid-template-columns: 1.05fr 1.18fr 0.75fr !important;
          }
          .staff-legacy-activity-page article.grid > div:nth-child(4),
          .staff-legacy-activity-page article.grid > div:nth-child(5) {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
