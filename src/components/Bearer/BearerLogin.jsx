import React, { useState } from 'react'

function BearerLogin() {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage(""); 

    try {
      const response = await fetch("/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.bearer_login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "token 0bde704e8493354:5709b3ab1a1cb1a",
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Login successful!");
        console.log("Logged-in user:", result.user);
        console.log("POS Profile:", result.pos_profile);   
        window.location.href = "/pos-dashboard";
      } else {
        setErrorMessage(result.message || "Login failed.");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again later.");
      console.error("Error during login:", error);
    }
  };
    return (
        <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Bearer Login</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.button}>
            Login
          </button>
          {errorMessage && (
            <div style={styles.errorMessage}>{errorMessage}</div>
          )}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f4f4f9",
  },
  loginBox: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "1.5em",
    marginBottom: "20px",
    color: "#333",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    fontSize: "14px",
    marginBottom: "5px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    border: "none",
    color: "white",
    fontSize: "16px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  errorMessage: {
    marginTop: "10px",
    color: "red",
    fontSize: "14px",
    textAlign: "center",
  },
};

export default BearerLogin