import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../Redux/Slices/userSlice";

function BearerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.user_login", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Login Raw API Response:", data);

      const responseData = data.message || data;
      const { user, session, pos_profile, company, allowed_item_groups, allowed_customer_groups, filtered_items, filtered_customers } = responseData;

      if (!user) throw new Error("User field missing in API response");

      const payload = {
        user,
        session,
        pos_profile,
        company,
        message: {
          allowed_item_groups: allowed_item_groups || [],
          allowed_customer_groups: allowed_customer_groups || [],
          filtered_items: filtered_items || [],
          filtered_customers: filtered_customers || [],
        },
      };
      console.log("Dispatching loginSuccess with payload:", payload);

      dispatch(loginSuccess(payload));

      localStorage.setItem("session", session || "");
      localStorage.setItem("user", user || "");
      localStorage.setItem("pos_profile", pos_profile || "");
      localStorage.setItem("company", company || "");
      localStorage.setItem("allowed_item_groups", JSON.stringify(allowed_item_groups || []));
      localStorage.setItem("allowed_customer_groups", JSON.stringify(allowed_customer_groups || []));
      localStorage.setItem("filtered_items", JSON.stringify(filtered_items || []));
      localStorage.setItem("filtered_customers", JSON.stringify(filtered_customers || []));

      alert("Login Successful!");
      navigate("/openingentry", { state: { user, pos_profile, company } });
    } catch (err) {
      setErrorMessage(err.message);
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          {errorMessage && <div style={styles.errorMessage}>{errorMessage}</div>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9" },
  loginBox: { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", width: "100%", maxWidth: "400px" },
  title: { fontSize: "1.5em", marginBottom: "20px", color: "#333", textAlign: "center" },
  form: { display: "flex", flexDirection: "column" },
  formGroup: { marginBottom: "15px" },
  label: { fontSize: "14px", marginBottom: "5px", color: "#555" },
  input: { width: "100%", padding: "10px", fontSize: "14px", border: "1px solid #ccc", borderRadius: "5px", outline: "none" },
  button: { width: "100%", padding: "10px", backgroundColor: "#007bff", border: "none", color: "white", fontSize: "16px", borderRadius: "5px", cursor: "pointer" },
  errorMessage: { marginTop: "10px", color: "red", fontSize: "14px", textAlign: "center" },
};

export default BearerLogin;