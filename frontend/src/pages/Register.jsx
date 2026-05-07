import {
    useState
  } from "react";
  
  import API from "../api/axios";
  import { useNavigate } from "react-router-dom";
  
  const Register = () => {
    const navigate = useNavigate();
  
    const [formData, setFormData] =
      useState({
        name: "",
        email: "",
        password: ""
      });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      try {
        await API.post(
          "/auth/register",
          formData
        );
  
        alert("Registered successfully");
  
        navigate("/login");
      } catch (error) {
        alert("Registration failed");
      }
    };
  
    return (
      <div className="form-container">
        <h2>Register</h2>
  
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
          />
  
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
            Register
          </button>
        </form>
      </div>
    );
  };
  
  export default Register;