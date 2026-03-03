import SidePanel from "../pages/SidePanel/SidePanel";
import { Outlet } from "react-router-dom";
import "./DashboardLayout.css";

const DashboardLayout = () => {
  return (
    <div className="dashboard">
      <SidePanel />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
