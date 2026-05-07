import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/">
        <h2>HN Insight Hub</h2>
      </Link>

      <div>
        {user ? (
          <>
            <Link to="/bookmarks">
              Bookmarks
            </Link>

            <button onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              Login
            </Link>

            <Link to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;