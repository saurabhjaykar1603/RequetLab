import { Check, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    icon: Sparkles,
    price: '$0',
    frequency: '/month',
    description: 'For common users and solo builders.',
    seats: 'Profile + core workspace',
    features: [
      'Personal workspaces',
      'Profile update settings',
      'Core collaboration workflow',
      'Profile management',
    ],
  },
  {
    name: 'Business',
    icon: Crown,
    price: '$39',
    frequency: '/month',
    description: 'For teams shipping in production.',
    seats: 'Business collaboration features',
    features: [
      'Everything in Free',
      'Plan controls in app',
      'Team-first collaboration setup',
    ],
  },
];

export default function PricingPage({ user }) {
  return (
    <div className="pricing-page-wrapper">
      <section className="pricing-page-hero">
        <span>Pricing Plans</span>
        <h1>Simple pricing for users and teams</h1>
        <p>
          Choose a plan and manage your profile inside the app. Payment integration is intentionally not required for
          this product flow.
        </p>
      </section>

      <section className="pricing-grid detailed">
        {plans.map((plan) => (
          <article key={plan.name} className={`pricing-card large ${plan.name === 'Business' ? 'featured' : ''}`}>
            <div className="pricing-card-head">
              <plan.icon size={18} />
              <h2>{plan.name}</h2>
            </div>
            <div className="pricing-amount">
              {plan.price}
              <span>{plan.frequency}</span>
            </div>
            <p className="pricing-subtitle">{plan.description}</p>
            <p className="pricing-seats">{plan.seats}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={14} /> {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="pricing-footer-cta">
        <Link to={user ? '/profile' : '/signup'} className="btn-primary marketing-cta">
          {user ? 'Manage Plan in Profile' : 'Create Free Account'}
        </Link>
        <Link to={user ? '/app' : '/'} className="btn-secondary marketing-cta-secondary">
          {user ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
      </section>
    </div>
  );
}
