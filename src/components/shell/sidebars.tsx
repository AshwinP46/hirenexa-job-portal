import { Sidebar } from "./Sidebar";
import {
  LayoutDashboard, User, Briefcase, FileText, CalendarCheck, Bell,
  PlusSquare, ListChecks, BarChart3, Users, Building2, FileBarChart, PieChart, ClipboardList,
  Activity, Brain, MessageSquare, Settings, Calendar, BookOpen,
} from "lucide-react";

export function StudentSidebar() {
  return (
    <Sidebar
      brand="HireNexa"
      tagline="Student Portal"
      brandIcon="student"
      items={[
        { title: "Dashboard", url: "/student", icon: LayoutDashboard },
        { title: "Profile", url: "/profile", icon: User },
        { title: "Jobs", url: "/jobs", icon: Briefcase },
        { title: "Resume Analyzer", url: "/student/resume-analyzer", icon: Brain },
        { title: "Live Chat", url: "/chat", icon: MessageSquare },
        { title: "Applications", url: "/applications", icon: FileText },
        { title: "Interviews", url: "/interviews", icon: CalendarCheck },
        { title: "Activity", url: "/activity", icon: Activity },
        { title: "Settings", url: "/settings", icon: Settings },
      ]}
      cta={{
        title: "Upgrade your profile",
        subtitle: "Get 3x more recruiter views",
        button: "Boost Profile",
      }}
    />
  );
}

export function RecruiterSidebar() {
  return (
    <Sidebar
      brand="HireNexa"
      tagline="Recruiter Suite"
      brandIcon="recruiter"
      items={[
        { title: "Dashboard", url: "/recruiter", icon: LayoutDashboard },
        { title: "Manage Jobs", url: "/recruiter/jobs", icon: ListChecks },
        { title: "Post Job", url: "/recruiter/jobs", icon: PlusSquare },
        { title: "Questions Gen", url: "/recruiter/questions", icon: Brain },
        { title: "Live Chat", url: "/chat", icon: MessageSquare },
        { title: "Offers & Templates", url: "/recruiter/offers", icon: FileText },
        { title: "Applicants", url: "/recruiter/jobs", icon: Users },
        { title: "Interviews", url: "/recruiter/jobs", icon: CalendarCheck },
        { title: "Analytics", url: "/recruiter", icon: BarChart3 },
        { title: "Activity", url: "/activity", icon: Activity },
        { title: "Profile", url: "/profile", icon: User },
        { title: "Settings", url: "/settings", icon: Settings },
      ]}
      cta={{
        title: "Featured listing",
        subtitle: "Reach top students",
        button: "Promote Job",
      }}
    />
  );
}

export function AdminSidebar() {
  return (
    <Sidebar
      brand="HireNexa"
      tagline="Admin Console"
      brandIcon="admin"
      items={[
        { title: "Dashboard", url: "/admin", search: { tab: "overview" }, icon: LayoutDashboard },
        { title: "Students", url: "/admin", search: { tab: "students" }, icon: Users },
        { title: "Recruiters", url: "/admin", search: { tab: "recruiters" }, icon: Building2 },
        { title: "Jobs", url: "/admin", search: { tab: "jobs" }, icon: Briefcase },
        { title: "Placement Drives", url: "/admin", search: { tab: "drives" }, icon: Calendar },
        { title: "CMS Console", url: "/admin", search: { tab: "cms" }, icon: BookOpen },
        { title: "Analytics", url: "/admin", search: { tab: "overview" }, icon: PieChart },
        { title: "Reports", url: "/admin", search: { tab: "reports" }, icon: FileBarChart },
        { title: "Audit Logs", url: "/admin", search: { tab: "audit" }, icon: ClipboardList },
        { title: "Activity", url: "/activity", icon: Activity },
        { title: "Settings", url: "/settings", icon: Settings },
      ]}
      cta={{
        title: "System health",
        subtitle: "All services operational",
        button: "View Status",
        gradient: "gradient-success",
      }}
    />
  );
}
