import React, { useEffect, useState } from "react";
import "../styles/LandingPage.css";
import { useNavigate } from "react-router-dom";


export default function LandingPage() {
  const navigate = useNavigate();

  const words = [
    "You",
    "Better collaboration",
    "Better planning",
    "Increased productivity"
  ];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // start fade out

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setFade(true); // fade back in
      }, 300); // match CSS fade duration

    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>

      {/* NAVBAR */}
      <div className="navbar">
        <div className="container nav-inner">
          <div className="logo">PM tool</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>
          
        <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
          
        </div>
      </div>

      {/* HERO SECTION */}
     {/* HERO SECTION */}
<div className="hero-art">
  <div className="hero-content container">

    <h1 className="hero-title">
      Project management
      <br />
      tool for
    </h1>

    <h2 className={`hero-rotating ${fade ? "fade-in" : "fade-out"}`}>
      {words[index]}
    </h2>

    <div className="card-grid">
      <div className="card">
        <h3>Scattered Work</h3>
        <p>Tasks live in chats, emails, and random tools.</p>
      </div>
      <div className="card">
        <h3>Missed Deadlines</h3>
        <p>No clear timeline means last-minute stress.</p>
      </div>
      <div className="card">
        <h3>Team Confusion</h3>
        <p>No one knows who’s doing what or when.</p>
      </div>
    </div>

  </div>
</div>


      {/* FEATURES */}
      <div className="section" id="features">
        <div className="container">
          <div className="feature-row">
            <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0" alt="Dashboard" />
            <div className="feature-text">
              <h2>Organize work your way</h2>
              <p>Boards, lists, and timelines that match your workflow.</p>
            </div>
          </div>

          <div className="feature-row">
            <div className="feature-text">
              <h2>See deadlines before they surprise you</h2>
              <p>Visual timelines help you plan smarter.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a" alt="Timeline" />
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section section-light" id="how">
        <div className="container">
          <h2 style={{ textAlign: "center" }}>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              Create your project
            </div>
            <div className="step">
              <div className="step-number">2</div>
              Add tasks & deadlines
            </div>
            <div className="step">
              <div className="step-number">3</div>
              Track progress in real time
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <h2>Ready to bring order to your projects?</h2>
        <button className="btn-primary">Start Free</button>
      </div>

      {/* FOOTER */}
      <div className="footer">
        © 2026 FlowPilot. All rights reserved.
      </div>

    </div>
  );
}
