import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import StudentFeed from "./feeds/StudentFeed";
import EmployerFeed from "./feeds/EmployerFeed";

export default function Feed() {
  const { currentUser } = useContext(AuthContext);
  const role = currentUser?.role || "STUDENT";

  if (role === "EMPLOYER") {
    return <EmployerFeed />;
  }

  // Default to StudentFeed for Students and Admins (or handle Admin specifically)
  return <StudentFeed />;
}
