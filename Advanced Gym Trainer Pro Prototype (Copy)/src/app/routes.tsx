import { createBrowserRouter } from "react-router";
import SplashScreen from "./pages/SplashScreen";
import MemberEntryScreen from "./pages/MemberEntryScreen";
import MemberProfileSetupScreen from "./pages/MemberProfileSetupScreen";
import OwnerAccessScreen from "./pages/OwnerAccessScreen";
import LoginScreen from "./pages/LoginScreen";
import SignupScreen from "./pages/SignupScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import HomeScreen from "./pages/HomeScreen";
import WorkoutScreen from "./pages/WorkoutScreen";
import ProfileScreen from "./pages/ProfileScreen";
import OwnerDashboard from "./pages/OwnerDashboard";
import AddMachineScreen from "./pages/AddMachineScreen";
import QuotesScreen from "./pages/QuotesScreen";
import MemberMachinesScreen from "./pages/MemberMachinesScreen";
import MachineDetailScreen from "./pages/MachineDetailScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/member/entry",
    Component: MemberEntryScreen,
  },
  {
    path: "/member/profile-setup",
    Component: MemberProfileSetupScreen,
  },
  {
    path: "/member/machines",
    Component: MemberMachinesScreen,
  },
  {
    path: "/machine/:id",
    Component: MachineDetailScreen,
  },
  {
    path: "/owner/access",
    Component: OwnerAccessScreen,
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/signup",
    Component: SignupScreen,
  },
  {
    path: "/onboarding",
    Component: OnboardingScreen,
  },
  {
    path: "/home",
    Component: HomeScreen,
  },
  {
    path: "/workout/:id",
    Component: WorkoutScreen,
  },
  {
    path: "/profile",
    Component: ProfileScreen,
  },
  {
    path: "/quotes",
    Component: QuotesScreen,
  },
  {
    path: "/owner/dashboard",
    Component: OwnerDashboard,
  },
  {
    path: "/owner/add-machine",
    Component: AddMachineScreen,
  },
]);