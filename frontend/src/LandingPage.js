import React from 'react';
import { Link } from 'react-router-dom';
import firmDetails from './firmDetails';
import './LandingPage.css';

const highlights = [
  'Biomass pellets and briquettes for industrial and commercial energy use',
  'Reliable dispatch planning with invoice-ready documentation',
  'Customer-focused supply support for recurring fuel requirements'
];

const products = [
  'Biomass Pellet 06MM',
  'Biomass Pellet 08MM',
  'Biomass Briquette 90MM',
  'Rice Husk Biomass',
  'DOC and industrial fuel support products'
];

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-brand">
            <strong>{firmDetails.name}</strong>
            <span>{firmDetails.address}</span>
            <span>
              GSTN: {firmDetails.gstn} | {firmDetails.contactNo}
            </span>
          </div>
          <div className="site-header__actions">
            <a href="#products" className="site-link">
              Products
            </a>
            <a href="#contact" className="site-link">
              Contact
            </a>
            <Link to="/owner-login" className="site-cta">
              Owner Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-section__inner">
            <div className="hero-copy">
              <p className="hero-kicker">Biomass Energy Supply</p>
              <h1>Clean fuel products backed by dependable dispatch and documentation.</h1>
              <p className="hero-text">
                {firmDetails.name} supports customers with biomass fuel products, business-ready
                billing, and a straightforward supply experience built around consistency.
              </p>
              <div className="hero-actions">
                <a href="#products" className="hero-btn hero-btn--primary">
                  Explore Products
                </a>
                <a href="#contact" className="hero-btn hero-btn--secondary">
                  Contact Us
                </a>
              </div>
            </div>
            <div className="hero-panel">
              <div className="hero-panel__card">
                <span>What we focus on</span>
                <ul>
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="content-grid">
            <article className="content-card">
              <p className="section-kicker">Why choose us</p>
              <h2>Built for steady supply and smooth commercial handling.</h2>
              <p>
                We serve customers who need dependable fuel movement, organized invoicing, and a
                supplier who understands day-to-day business requirements, not just product delivery.
              </p>
            </article>
            <article className="content-card">
              <p className="section-kicker">Business details</p>
              <h2>Reach us directly.</h2>
              <div className="detail-stack" id="contact">
                <p>{firmDetails.address}</p>
                <p>State: {firmDetails.state}</p>
                <p>Contact: {firmDetails.contactNo}</p>
                <p>Email: {firmDetails.email}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <p className="section-kicker">Product Focus</p>
            <h2>Core products we support for customer supply requirements.</h2>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article key={product} className="product-card">
                <strong>{product}</strong>
                <p>Supply-oriented support for industrial and recurring commercial demand.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="owner-entry">
          <div className="owner-entry__card">
            <p className="section-kicker">Owner Access</p>
            <h2>Secure access for internal invoice and dashboard tools.</h2>
            <p>
              Administrative functions are protected behind a sign-in step and are intended only for
              authorized owners and staff.
            </p>
            <Link to="/owner-login" className="hero-btn hero-btn--primary">
              Continue to Owner Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
