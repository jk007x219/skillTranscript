import StaffActivitiesPage from "@/components/staff/StaffActivitiesPage";
import ActivityWorkflowPanel from "@/components/staff/ActivityWorkflowPanel";
import StaffActivityCategoryTabs from "@/components/staff/StaffActivityCategoryTabs";
import styles from "./page.module.css";

export default function StaffActivitiesRoutePage() {
  return (
    <>
      <div className="px-4 pt-4 sm:px-6 lg:px-7">
        <StaffActivityCategoryTabs />
        <div className="staff-activity-workflow-root">
          <ActivityWorkflowPanel />
        </div>
      </div>
      <div className={styles.legacyActivityPage}>
        <StaffActivitiesPage />
      </div>
    </>
  );
}
