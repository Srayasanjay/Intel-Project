import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./Home";
import Study from "./Study";

function App() {
  return (
    <Router>
      <nav style={{ padding: 20, background: "#000814", color: "#caf0f8" }}>
        <Link to="/" style={{ marginRight: 20, color: "#00b4d8" }}>
          Home
        </Link>
        <Link to="/study" style={{ color: "#00b4d8" }}>
          Study
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<Study />} />
      </Routes>
    </Router>
  );
}

export default App;
