import StaffActivitiesPage from "@/components/staff/StaffActivitiesPage";
import ActivityWorkflowPanel from "@/components/staff/ActivityWorkflowPanel";
import styles from "./page.module.css";

export default function StaffActivitiesRoutePage() {
  return (
    <>
      <div className="staff-activity-workflow-root">
        <ActivityWorkflowPanel />
      </div>
      <div className={styles.legacyActivityPage}>
        <StaffActivitiesPage />
      </div>
    </>
  );
}
