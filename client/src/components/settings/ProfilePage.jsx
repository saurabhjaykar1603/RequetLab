import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from 'toast-ninja';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../api';

const defaultProfile = {
  name: '',
  email: '',
  jobTitle: '',
  company: '',
  bio: '',
  avatarUrl: '',
};

export default function ProfilePage({ user, onUserChange }) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profile, setProfile] = useState(() => ({ ...defaultProfile, ...(user || {}) }));

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const meRes = await api.getMe();
        if (meRes?.user) {
          const merged = {
            ...defaultProfile,
            ...meRes.user,
          };
          setProfile(merged);
          localStorage.setItem('user', JSON.stringify(meRes.user));
          onUserChange(meRes.user);
        }
      } catch (error) {
        showToast({ message: 'Failed to load profile settings', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const response = await api.updateProfile({
        name: profile.name,
        jobTitle: profile.jobTitle,
        company: profile.company,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.user) {
        setProfile({ ...defaultProfile, ...response.user });
        localStorage.setItem('user', JSON.stringify(response.user));
        onUserChange(response.user);
      }

      showToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      showToast({ message: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <Link to="/app" className="btn-secondary settings-back-link">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <Link to="/pricing" className="btn-secondary settings-back-link">
          View Pricing
        </Link>
      </header>

      <main className="settings-content profile-only">
        <section className="settings-card">
          <h1>User Profile</h1>
          <p>Update your account details and personal identity in the product.</p>

          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  required
                  value={profile.name}
                  onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input disabled value={profile.email} placeholder="you@company.com" />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input
                  value={profile.jobTitle}
                  onChange={(event) => setProfile((prev) => ({ ...prev, jobTitle: event.target.value }))}
                  placeholder="Product Engineer"
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  value={profile.company}
                  onChange={(event) => setProfile((prev) => ({ ...prev, company: event.target.value }))}
                  placeholder="RequestLab"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Avatar URL</label>
              <input
                value={profile.avatarUrl}
                onChange={(event) => setProfile((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Tell teammates what you focus on"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isSavingProfile || isLoading}>
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
