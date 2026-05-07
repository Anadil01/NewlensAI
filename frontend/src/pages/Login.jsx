import {
    useState
  } from "react";
  
  import API from "../api/axios";
  import { useNavigate } from "react-router-dom";
  import { useAuth } from "../context/AuthContext";
  
  const Login = () => {
    const navigate = useNavigate();
  
    const { login } = useAuth();
  
    const [formData, setFormData] =
      useState({
        email: "",
        password: ""
      });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      try {
        const { data } = await API.post(
          "/auth/login",
          formData
        );
  
        login(data);
  
        navigate("/");
      } catch (error) {
        alert("Invalid credentials");
      }
    };
  
    return (
      <div className="form-container">
        <h2>Login</h2>
  
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value
              })
            }
          />
  
          <input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value
              })
            }
          />
  
          <button type="submit">
            Login
          </button>
        </form>
      </div>
    );
  };
  
  export default Login;