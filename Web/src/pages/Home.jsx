import "../styles/home.css";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <section className="hero">
        <h1>Find the Right Internship, Faster</h1>
        <p>
          InternMatch connects students with companies offering meaningful
          internship opportunities.
        </p>
        <div className="hero-buttons">
          <a href="/register" className="primary-btn">Get Started</a>
          <a href="/login" className="secondary-btn">Login</a>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          🎓 <h3>For Students</h3>
          <p>Discover internships and track your applications.</p>
        </div>

        <div className="feature-card">
          🏢 <h3>For Employers</h3>
          <p>Post opportunities and manage applicants easily.</p>
        </div>

        <div className="feature-card">
          🔐 <h3>Secure System</h3>
          <p>JWT authentication with role-based access.</p>
        </div>
      </section>
    </>
  );
}
