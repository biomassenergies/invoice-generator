import React from 'react';
import { Link } from 'react-router-dom';
import firmDetails from './firmDetails';
import './LandingPage.css';

const rawMaterials = ['Sawdust', 'Wood chips', 'Rice husk', 'Groundnut shells', 'Bagasse'];

const manufacturingSteps = [
  'Drying (Moisture < 15%)',
  'Grinding',
  'High-pressure compression'
];

const products = [
  {
    title: 'Biomass Briquette',
    points: [
      'High-density eco-friendly fuel',
      'Made from organic waste such as sawdust, groundnut shells, and agro residues',
      'Standard size: 90 MM circular',
      'Alternative to coal for industrial use'
    ],
    subheading: 'Benefits',
    details: ['Carbon-neutral', 'Low ash content', 'Stable pricing']
  },
  {
    title: 'Biomass Pellet',
    points: [
      'Cylindrical biofuel',
      'Size: 6-8 mm',
      'Ideal for automated systems'
    ],
    subheading: 'Applications',
    details: ['Industrial boilers', 'Residential stoves', 'Commercial heating systems']
  },
  {
    title: 'DOC (De-Oiled Cakes)',
    points: ['Examples: Sal Seed, Cashew'],
    subheading: 'Functions',
    details: ['Natural binder', 'Calorific booster', 'Ideal for low-lignin materials like rice husk and straw']
  },
  {
    title: 'Sawdust',
    points: ['Directly sourced from sawmills'],
    subheading: 'Types',
    details: ['Pure wood sawdust', 'Mixed wood sawdust']
  },
  {
    title: 'Wood Charcoal',
    points: ['Reliable solid fuel option for high-heat applications'],
    subheading: 'Applications',
    details: ['Metallurgy', 'Foundry work', 'Tandoors and BBQ']
  },
  {
    title: 'Biomass Rice Husk',
    points: ['Byproduct of rice milling', 'Outer shell of paddy grain'],
    subheading: 'Use',
    details: ['Suitable for biomass fuel processing and energy applications']
  },
  {
    title: 'Packing Pallets',
    points: ['Used in logistics', 'Cost-effective and reusable'],
    subheading: 'Support',
    details: ['Helps streamline handling, storage, and movement']
  },
  {
    title: 'Biomass Pellet Stove',
    points: ['Commercial stove burner'],
    subheading: 'Variants',
    details: ['1 KG', '5 KG', '10 KG', '15 KG', '20 KG']
  }
];

const comparisonRows = [
  ['Size', '6-8 mm', '90 mm'],
  ['Application', 'Small-scale & automated', 'Industrial'],
  ['Density', 'High', 'Moderate'],
  ['Combustion', 'High energy', 'Long duration'],
  ['Moisture', '<10%', '15-20%'],
  ['Production', 'High precision', 'Less intensive']
];

const advantages = [
  {
    title: 'Environmental Impact',
    points: ['Renewable', 'Pollution-free', 'Lower greenhouse emissions than coal']
  },
  {
    title: 'Energy Efficiency',
    points: ['Calorific Value: 3500-5000 Kcal/kg', 'Consistent performance']
  },
  {
    title: 'Cost Efficiency',
    points: ['Cheaper than coal and firewood', 'Stable pricing']
  },
  {
    title: 'Logistics',
    points: ['Easy storage', 'Easy transportation']
  }
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
            <a href="#process" className="site-link">
              Process
            </a>
            <a href="#advantages" className="site-link">
              Advantages
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-section__inner">
            <div className="hero-copy">
              <p className="hero-kicker">Sustainable Biomass Fuel Solutions</p>
              <h1>Pellets and briquettes built for industrial and commercial energy needs.</h1>
              <p className="hero-text">
                Eco-friendly, high-performance fuel alternatives designed to support cleaner energy
                use, dependable supply, and practical commercial handling.
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
                <span>Core Focus</span>
                <ul>
                  <li>Biomass pellets and briquettes for industrial and commercial use</li>
                  <li>Cleaner fuel alternatives built from organic and agro-waste sources</li>
                  <li>Products supported by business-ready supply and owner-managed systems</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section" id="process">
          <div className="content-grid">
            <article className="content-card">
              <p className="section-kicker">Raw Materials</p>
              <h2>Organic inputs chosen for dependable fuel performance.</h2>
              <div className="chip-list">
                {rawMaterials.map((item) => (
                  <span key={item} className="info-chip">
                    {item}
                  </span>
                ))}
              </div>
            </article>
            <article className="content-card">
              <p className="section-kicker">Manufacturing Process</p>
              <h2>Simple production flow with no additives required.</h2>
              <ol className="number-list">
                {manufacturingSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="process-note">
                Natural lignin acts as a binder, which removes the need for added chemicals.
              </p>
            </article>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <p className="section-kicker">Products</p>
            <h2>Fuel and support products aligned with real operational demand.</h2>
          </div>
          <div className="product-grid product-grid--expanded">
            {products.map((product) => (
              <article key={product.title} className="product-card">
                <strong>{product.title}</strong>
                <ul className="product-points">
                  {product.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <p className="product-subheading">{product.subheading}</p>
                <ul className="product-details">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="comparison-section">
          <div className="section-heading">
            <p className="section-kicker">Briquettes vs Pellets</p>
            <h2>A quick comparison between the two primary biomass fuel formats.</h2>
          </div>
          <div className="comparison-card">
            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Pellets</th>
                    <th>Briquettes</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row[0]}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="content-grid">
            <article className="content-card">
              <p className="section-kicker">Key Types and Specifications</p>
              <h2>Agro-waste and sawdust-based briquette options.</h2>
              <div className="detail-stack">
                <p><strong>Agro-Waste Briquettes</strong></p>
                <p>Raw materials: mustard husk, groundnut shells, cotton stalk</p>
                <p>Calorific Value: 4000-4500 Kcal/kg</p>
                <p>Moisture: 10-15%</p>
                <p><strong>Sawdust/Wood Briquettes</strong></p>
                <p>Higher density, uniform combustion, suitable for industrial boilers</p>
              </div>
            </article>
            <article className="content-card" id="contact">
              <p className="section-kicker">Business Details</p>
              <h2>Reach us for supply and product discussions.</h2>
              <div className="detail-stack">
                <p>{firmDetails.address}</p>
                <p>State: {firmDetails.state}</p>
                <p>Contact: {firmDetails.contactNo}</p>
                <p>Email: {firmDetails.email}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="advantages-section" id="advantages">
          <div className="section-heading">
            <p className="section-kicker">Advantages of Biomass Fuel</p>
            <h2>Environmental, energy, cost, and logistics benefits in one view.</h2>
          </div>
          <div className="advantage-grid">
            {advantages.map((advantage) => (
              <article key={advantage.title} className="advantage-card">
                <strong>{advantage.title}</strong>
                <ul>
                  {advantage.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

      </main>

      <footer className="site-footer">
        <div className="site-footer__grid">
          <section className="footer-column">
            <h3>About Us</h3>
            <p>
              {firmDetails.name} offers biomass pellets, briquettes, and related fuel-support
              products for industrial and commercial energy needs. We focus on eco-friendly fuel
              options, dependable supply, and practical delivery support for customers.
            </p>
          </section>

          <section className="footer-column">
            <h3>Get In Touch</h3>
            <p>Address: {firmDetails.address}</p>
            <p>Email: biomassenergies@gmail.com</p>
            <p>Customer Helpdesk: Devesh - 8550952303, Amit - 9890514547</p>
          </section>

          <section className="footer-column footer-column--meta">
            <p className="footer-note">
              Biomass fuel solutions for cleaner industrial and commercial energy use.
            </p>
            <p className="footer-fineprint">
              Internal use only:{' '}
              <Link to="/owner-login" className="owner-fineprint-link">
                Owner Access
              </Link>
            </p>
          </section>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
