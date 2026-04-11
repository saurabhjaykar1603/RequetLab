import { ArrowRight, CheckCircle2, Layers3, Rocket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const highlights = [
  {
    icon: Rocket,
    title: 'Ship API work faster',
    description: 'Collections, environments, and request history designed for teams moving quickly.',
  },
  {
    icon: Users,
    title: 'Organization-ready',
    description: 'Create organizations, assign teammates, and manage seats by plan without payment setup.',
  },
  {
    icon: Layers3,
    title: 'Single product flow',
    description: 'Marketing pages, profile settings, and workspace execution all in one RequestLab experience.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    subtitle: 'Best for solo builders and personal projects.',
    seats: 'Up to 3 organization members',
    features: ['Core API workspace', 'Collections, folders, and environments', 'Basic organization setup'],
  },
  {
    name: 'Business',
    price: '$39',
    subtitle: 'Built for growing product and platform teams.',
    seats: 'Up to 25 organization members',
    features: ['Everything in Free', 'Larger team seat capacity', 'Priority collaboration workflow'],
  },
];

export default function HomePage({ user }) {
  return (
    <div className="marketing-page">
      <section className="marketing-hero">
        <div className="marketing-badge">RequestLab SaaS Edition</div>
        <h1>Collaborative API testing with profile, pricing, and organization controls.</h1>
        <p>
          Build requests, manage teams, and move from personal usage to business-ready operations using the
          same product surface.
        </p>
        <div className="marketing-actions">
          <Link to={user ? '/app' : '/signup'} className="btn-primary marketing-cta">
            {user ? 'Open Dashboard' : 'Start Free'} <ArrowRight size={14} />
          </Link>
          <Link to="/pricing" className="btn-secondary marketing-cta-secondary">View Pricing</Link>
        </div>
      </section>

      <section className="marketing-highlights">
        {highlights.map((item) => (
          <article key={item.title} className="marketing-card">
            <item.icon size={18} />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="marketing-pricing-preview">
        <div className="marketing-section-head">
          <span>Pricing</span>
          <h2>Two clear plans. No payment integration required.</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`pricing-card ${plan.name === 'Business' ? 'featured' : ''}`}>
              <h3>{plan.name}</h3>
              <div className="pricing-amount">
                {plan.price}
                <span>/month</span>
              </div>
              <p className="pricing-subtitle">{plan.subtitle}</p>
              <p className="pricing-seats">{plan.seats}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={14} /> {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
