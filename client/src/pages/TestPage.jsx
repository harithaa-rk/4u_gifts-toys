import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const TestPage = () => {
  const [message, setMessage] = useState("Checking...");

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/test`)
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch((err) => {
        setMessage("❌ Backend not connected");
        console.error(err);
      });
  }, []);

  return (
    <div style={{ padding: "100px", textAlign: "center" }}>
      <h1>Backend Connection Test</h1>
      <h2>{message}</h2>
    </div>
  );
};

export default TestPage;