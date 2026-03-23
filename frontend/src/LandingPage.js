import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import firmDetails from './firmDetails';
import './LandingPage.css';

const productFamilies = [
  {
    title: 'Fuel Products',
    description: 'Cleaner solid fuels engineered for industrial boilers, process heating, and commercial energy use.',
    items: [
      {
        title: 'Biomass Pellets',
        image:
          'https://5.imimg.com/data5/SELLER/Default/2023/3/IP/JJ/HF/56292250/6mm-saw-dust-pellets-250x250.jpg',
        points: ['6-8 mm precision size', 'Good for automated systems', 'Consistent combustion and handling']
      },
      {
        title: 'Biomass Briquettes',
        image:
          'https://5.imimg.com/data5/SELLER/Default/2024/2/391098779/TV/ZD/CZ/56292250/white-coal-biomass-briquette-250x250.jpeg',
        points: ['90 mm circular format', 'Longer burn duration', 'Reliable coal alternative for industry']
      },
      {
        title: 'Biomass Rice Husk',
        image:
          'https://5.imimg.com/data5/SELLER/Default/2023/6/314440534/IE/TD/YN/56292250/rice-husk-250x250.jpg',
        points: ['Agro-based energy input', 'Useful in biomass fuel processing', 'Suitable for blended applications']
      },
      {
        title: 'Wood Charcoal',
        points: ['High-heat performance', 'Used in foundry, metallurgy, tandoor and BBQ applications']
      }
    ]
  },
  {
    title: 'Raw Material and Additives',
    description: 'Feedstock and binding support for dependable biomass production and calorific performance.',
    items: [
      {
        title: 'DOC (De-Oiled Cakes)',
        image:
          'https://5.imimg.com/data5/SELLER/Default/2023/3/ZD/EU/UI/56292250/cashew-de-oiled-cake-250x250.jpg',
        points: ['Natural binder', 'Calorific booster', 'Helpful for lower-lignin raw materials']
      },
      {
        title: 'Sawdust',
        points: ['Direct from sawmills', 'Available in pure and mixed wood grades']
      },
      {
        title: 'Raw Material Base',
        points: ['Sawdust', 'Wood chips', 'Groundnut shells', 'Bagasse', 'Rice husk']
      }
    ]
  },
  {
    title: 'Equipment and Logistics Support',
    description: 'Operational products and execution support beyond fuel supply.',
    items: [
      {
        title: 'Biomass Pellet Stove',
        image: `${process.env.PUBLIC_URL}/15KG-Stove.png`,
        points: ['Commercial stove burner', 'Available in 1 kg, 5 kg, 10 kg, 15 kg and 20 kg variants']
      },
      {
        title: 'Packing Pallets',
        image:
          'https://5.imimg.com/data5/SELLER/Default/2021/12/QC/JJ/BM/6555452/wooden-packing-pallet-1000x1000.jpg',
        points: ['Reusable logistics support', 'Cost-effective loading and movement solution']
      },
      {
        title: 'Project Consulting',
        points: ['Bio energy project planning', 'Machinery installation guidance', 'Plant setup support']
      }
    ]
  }
];

const productCategories = [
  { title: 'Pellets', description: 'Best for more controlled feeding and automated combustion systems.' },
  { title: 'Briquettes', description: 'Best for industrial heat demand where durable, dense solid fuel is preferred.' },
  { title: 'Feedstock and DOC', description: 'Improves production flexibility and supports better fuel blending outcomes.' },
  { title: 'Equipment and Logistics', description: 'Stoves, pallets, and handling support that complete the operating cycle.' }
];

const keyBenefits = [
  {
    title: 'Cleaner Energy Transition',
    points: ['Renewable fuel pathway', 'Lower emissions than many conventional solid fuels', 'Better fit for sustainability-focused operations']
  },
  {
    title: 'Operational Reliability',
    points: ['Steady supply orientation', 'Practical for boilers and process heating', 'Consistent product handling']
  },
  {
    title: 'Commercial Practicality',
    points: ['Stable pricing logic', 'Easy storage and transport', 'Suitable for industrial and commercial buying cycles']
  }
];

const technicalAdvantages = [
  {
    title: 'Pellets',
    points: ['High density', 'High energy output', 'Moisture generally below 10%', 'Better suited to automated feeding']
  },
  {
    title: 'Briquettes',
    points: ['Longer burn duration', 'Strong use-case in industry', 'Moisture typically around 15-20%', 'Less production-intensive format']
  },
  {
    title: 'Material Quality',
    points: ['Natural lignin can act as a binder', 'No additive-heavy process required', 'Feedstocks selected from proven biomass sources']
  }
];

const applications = [
  'Industrial boilers',
  'Commercial heating systems',
  'Residential and commercial stove use',
  'Boiler fuel substitution projects',
  'Bio energy plant setup and machinery planning'
];

const processSteps = [
  'Drying raw material to controlled moisture levels',
  'Grinding for size consistency',
  'High-pressure compression for dense fuel formation'
];

const companyStats = [
  { label: 'Founded', value: '2020' },
  { label: 'Base', value: 'Nagpur' },
  { label: 'Focus', value: 'Biofuels + Projects' },
  { label: 'Support', value: 'Products + Consulting' }
];

const comparisonRows = [
  ['Format', '6-8 mm cylindrical fuel', '90 mm dense fuel block'],
  ['Best Fit', 'Automated or smaller controlled systems', 'Industrial heat demand'],
  ['Density', 'High', 'Moderate to high'],
  ['Combustion', 'Higher energy response', 'Longer duration burning'],
  ['Moisture', 'Typically below 10%', 'Typically around 15-20%']
];

const whatsappLinks = {
  devesh:
    'https://wa.me/918550952303?text=Hello%20Mahalaxmi%20Agro%20Energies.%20I%20want%20to%20know%20more%20about%20your%20biomass%20products%2C%20plant%20setup%2C%20and%20related%20services.',
  amit:
    'https://wa.me/919890514547?text=Hello%20Mahalaxmi%20Agro%20Energies.%20I%20want%20to%20know%20more%20about%20your%20biomass%20products.'
};

const consultationLink =
  'https://wa.me/918550952303?text=Hello%20Devesh%2C%20I%20would%20like%20to%20book%20a%20free%20consultation%20for%20biomass%20products%2C%20bio-energy%20services%2C%20machinery%20installation%2C%20or%20plant%20setup.';

function LandingPage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const mapEmbedUrl = useMemo(
    () => 'https://maps.google.com/maps?q=21.10248,79.1082&z=15&output=embed',
    []
  );

  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#top" className="site-brand site-brand--link">
            <img
              src={`${process.env.PUBLIC_URL}/mae-logo.png`}
              alt={firmDetails.name}
              className="site-brand__logo"
            />
            <div className="site-brand__copy">
              <strong>{firmDetails.name}</strong>
              <span>Energy for Tomorrow</span>
              <span>Nagpur based biomass fuels and bio energy project support</span>
            </div>
          </a>
          <div className="site-header__actions">
            <a href="#products" className="site-link">
              Products
            </a>
            <a href="#benefits" className="site-link">
              Benefits
            </a>
            <a href="#services" className="site-link">
              Services
            </a>
            <a href="#location" className="site-link">
              Location
            </a>
            <a href={consultationLink} className="hero-btn hero-btn--primary" target="_blank" rel="noreferrer">
              Book Free Consultation
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-section__inner hero-section__inner--wide">
            <div className="hero-copy hero-copy--modern">
              <p className="hero-kicker">Sustainable Biomass Fuel Solutions</p>
              <h1>Industrial biofuel supply and bio energy project support from Nagpur.</h1>
              <p className="hero-text">
                {firmDetails.name} manufactures and supplies biomass briquettes, biomass pellets,
                sawdust, stoves, and related support products, while also consulting on bio energy
                projects, machinery installation, and plant setup.
              </p>
              <p className="hero-text hero-text--compact">
                Founded in 2020 in Nagpur, we serve businesses looking for cleaner, practical, and
                commercially workable alternatives to conventional solid fuels.
              </p>
              <div className="hero-actions">
                <a href="#products" className="hero-btn hero-btn--primary">
                  Explore Product Range
                </a>
                <a
                  href={consultationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hero-btn hero-btn--secondary"
                >
                  Book a Free Consultation
                </a>
                <button
                  type="button"
                  className="hero-btn hero-btn--ghost hero-btn--button"
                  onClick={() => setIsContactOpen(true)}
                >
                  Contact Us
                </button>
              </div>
            </div>

            <div className="hero-stack">
              <div className="hero-highlight-card">
                <p className="hero-highlight-card__label">Why customers come to us</p>
                <ul>
                  <li>Biomass pellets and briquettes for practical industrial use</li>
                  <li>Product supply plus machinery and plant setup consulting</li>
                  <li>Nagpur-based team with responsive helpdesk and WhatsApp support</li>
                </ul>
              </div>
              <div className="stats-grid">
                {companyStats.map((stat) => (
                  <article key={stat.label} className="stat-card">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="narrative-section">
          <div className="section-shell">
            <div className="section-heading section-heading--split">
              <div>
                <p className="section-kicker">What We Do</p>
                <h2>A clearer view of our business, products, and service support.</h2>
              </div>
              <p className="section-intro">
                We focus on biofuel products that are easier to store, move, and use in real-world
                industrial environments, while also helping customers with plant planning and
                machinery execution decisions.
              </p>
            </div>

            <div className="message-grid">
              <article className="message-card">
                <strong>Manufacturer and Supplier</strong>
                <p>
                  Biomass briquettes, biomass pellets, sawdust, biomass stove, cashew cake and
                  related support products for industrial, commercial, wholesale and retail demand.
                </p>
              </article>
              <article className="message-card">
                <strong>Consulting and Execution Guidance</strong>
                <p>
                  Support for bio energy projects including machinery installation, fuel planning,
                  and plant setup advisory for customers moving toward biomass-led operations.
                </p>
              </article>
              <article className="message-card">
                <strong>Built for Commercial Use</strong>
                <p>
                  We position products around actual operational fit: boiler use, heating systems,
                  combustion reliability, handling simplicity, and cost practicality.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-shell">
            <div className="section-heading">
              <p className="section-kicker">Product Categories</p>
              <h2>A more organized product structure for buyers and project decision-makers.</h2>
            </div>

            <div className="category-grid">
              {productCategories.map((category) => (
                <article key={category.title} className="category-card">
                  <strong>{category.title}</strong>
                  <p>{category.description}</p>
                </article>
              ))}
            </div>

            <div className="family-stack">
              {productFamilies.map((family) => (
                <section key={family.title} className="family-section">
                  <div className="family-heading">
                    <div>
                      <p className="section-kicker">{family.title}</p>
                      <h3>{family.description}</h3>
                    </div>
                  </div>
                  <div className="product-grid product-grid--family">
                    {family.items.map((item) => (
                      <article key={item.title} className="product-card product-card--fresh">
                        {item.image ? (
                          <img className="product-image" src={item.image} alt={item.title} />
                        ) : null}
                        <strong>{item.title}</strong>
                        <ul className="product-points">
                          {item.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section content-section--warm">
          <div className="section-shell">
            <div className="section-heading section-heading--split">
              <div>
                <p className="section-kicker">Raw Materials and Process</p>
                <h2>Feedstock selection and a straightforward manufacturing flow.</h2>
              </div>
              <p className="section-intro">
                Sawdust, wood chips, rice husk, groundnut shells, and bagasse are among the core
                biomass sources we work with. Natural lignin can act as a binder, reducing the need
                for additive-heavy processing.
              </p>
            </div>

            <div className="process-layout">
              <article className="content-card content-card--contrast">
                <p className="section-kicker">Raw Materials</p>
                <div className="chip-list">
                  {['Sawdust', 'Wood chips', 'Rice husk', 'Groundnut shells', 'Bagasse'].map((item) => (
                    <span key={item} className="info-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </article>

              <article className="content-card">
                <p className="section-kicker">Manufacturing Process</p>
                <ol className="number-list">
                  {processSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>

              <article className="content-card">
                <p className="section-kicker">Applications</p>
                <ul className="product-points">
                  {applications.map((application) => (
                    <li key={application}>{application}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="comparison-section">
          <div className="section-shell">
            <div className="section-heading">
              <p className="section-kicker">Pellets vs Briquettes</p>
              <h2>Choose the fuel format based on system type, handling, and burn profile.</h2>
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
          </div>
        </section>

        <section className="advantages-section" id="benefits">
          <div className="section-shell">
            <div className="section-heading section-heading--split">
              <div>
                <p className="section-kicker">Advantages and Key Benefits</p>
                <h2>Separated into business benefits and technical product strengths.</h2>
              </div>
              <p className="section-intro">
                This section is intentionally split so customers can quickly understand both the
                commercial upside and the product-level reasoning behind biomass adoption.
              </p>
            </div>

            <div className="benefit-layout">
              <div className="benefit-column">
                <h3>Key Benefits</h3>
                <div className="advantage-grid advantage-grid--stacked">
                  {keyBenefits.map((benefit) => (
                    <article key={benefit.title} className="advantage-card">
                      <strong>{benefit.title}</strong>
                      <ul>
                        {benefit.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>

              <div className="benefit-column">
                <h3>Technical Advantages</h3>
                <div className="advantage-grid advantage-grid--stacked">
                  {technicalAdvantages.map((advantage) => (
                    <article key={advantage.title} className="advantage-card advantage-card--accent">
                      <strong>{advantage.title}</strong>
                      <ul>
                        {advantage.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-shell">
            <div className="services-panel">
              <div className="services-copy">
                <p className="section-kicker">Bio Energy Services</p>
                <h2>Book a conversation for products, machinery, or plant setup support.</h2>
                <p>
                  Along with fuel supply, we also consult on bio energy projects. If you are
                  exploring machinery installation, plant setup, or product selection for a new or
                  existing operation, we can help you start with a practical discussion.
                </p>
                <div className="hero-actions">
                  <a href={consultationLink} className="hero-btn hero-btn--primary" target="_blank" rel="noreferrer">
                    Book a Free Consultation
                  </a>
                  <button
                    type="button"
                    className="hero-btn hero-btn--ghost hero-btn--button"
                    onClick={() => setIsContactOpen(true)}
                  >
                    Talk to Helpdesk
                  </button>
                </div>
              </div>
              <div className="services-list-card">
                <strong>We can help with</strong>
                <ul>
                  <li>Product selection for pellets, briquettes, rice husk, DOC, and support inputs</li>
                  <li>Machinery installation planning</li>
                  <li>Plant setup discussion and execution guidance</li>
                  <li>Commercial and industrial use-case alignment</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="location-section" id="location">
          <div className="section-shell">
            <div className="section-heading section-heading--split">
              <div>
                <p className="section-kicker">Location</p>
                <h2>Visit or navigate to our Nagpur location.</h2>
              </div>
              <a
                href="https://www.google.co.in/maps/dir//21.10248000,79.10820000"
                target="_blank"
                rel="noreferrer"
                className="site-link site-link--action"
              >
                Open Directions
              </a>
            </div>

            <div className="location-grid">
              <div className="map-card">
                <iframe
                  title="Mahalaxmi Agro Energies location"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="location-card">
                <strong>{firmDetails.name}</strong>
                <p>{firmDetails.address}</p>
                <p>Email: biomassenergies@gmail.com</p>
                <p>Customer Helpdesk: Devesh - 8550952303, Amit - 9890514547</p>
                <div className="footer-whatsapp-links">
                  <a href={whatsappLinks.devesh} target="_blank" rel="noreferrer">
                    WhatsApp Devesh
                  </a>
                  <a href={whatsappLinks.amit} target="_blank" rel="noreferrer">
                    WhatsApp Amit
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__grid">
          <section className="footer-column">
            <h3>About Us</h3>
            <p>
              Mahalaxmi Agro Energies is a Nagpur-based manufacturer and supplier of biofuels,
              established in 2020, serving industrial and commercial fuel requirements with biomass
              briquettes, biomass pellets, sawdust, biomass stove, and allied products.
            </p>
            <p>
              We also consult on bio energy projects in terms of machinery installation and plant
              setup, helping customers move from interest to implementation with better clarity.
            </p>
          </section>

          <section className="footer-column">
            <h3>Get In Touch</h3>
            <p>Address: {firmDetails.address}</p>
            <p>Email: biomassenergies@gmail.com</p>
            <p>Customer Helpdesk Numbers: Devesh - 8550952303, Amit - 9890514547</p>
            <div className="footer-whatsapp-links">
              <a href={whatsappLinks.devesh} target="_blank" rel="noreferrer">
                WhatsApp Devesh
              </a>
              <a href={whatsappLinks.amit} target="_blank" rel="noreferrer">
                WhatsApp Amit
              </a>
            </div>
          </section>

          <section className="footer-column footer-column--meta">
            <p className="footer-note">
              Manufacturer and supplier of biofuels with consulting support for products, machinery,
              and plant setup.
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

      {isContactOpen ? (
        <div className="contact-modal-backdrop" onClick={() => setIsContactOpen(false)}>
          <div
            className="contact-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
          >
            <button
              type="button"
              className="contact-modal-close"
              onClick={() => setIsContactOpen(false)}
              aria-label="Close contact details"
            >
              x
            </button>
            <p className="section-kicker">Get In Touch</p>
            <h2 id="contact-modal-title">Customer Helpdesk</h2>
            <div className="contact-modal-list">
              <p>Email: biomassenergies@gmail.com</p>
              <p>
                Devesh: 8550952303{' '}
                <a href={whatsappLinks.devesh} target="_blank" rel="noreferrer">
                  Chat on WhatsApp
                </a>
              </p>
              <p>
                Amit: 9890514547{' '}
                <a href={whatsappLinks.amit} target="_blank" rel="noreferrer">
                  Chat on WhatsApp
                </a>
              </p>
              <p>Address: {firmDetails.address}</p>
              <p>
                <a href={consultationLink} target="_blank" rel="noreferrer">
                  Book a Free Consultation
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default LandingPage;
