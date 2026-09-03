import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const PublicOnlyRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;