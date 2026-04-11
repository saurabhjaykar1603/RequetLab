import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from 'toast-ninja';
import { ArrowLeft, Building2, Crown, Sparkles, UserPlus, Users } from 'lucide-react';
import { api } from '../../api';

const defaultProfile = {
  name: '',
  email: '',
  jobTitle: '',
  company: '',
  bio: '',
  avatarUrl: '',
};

const planOptions = [
  { value: 'free', label: 'Free' },
  { value: 'business', label: 'Business' },
];

export default function ProfilePage({ user, onUserChange }) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profile, setProfile] = useState(() => ({ ...defaultProfile, ...(user || {}) }));

  const [organizations, setOrganizations] = useState([]);
  const [organizationMembers, setOrganizationMembers] = useState({});
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('free');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId),
    [organizations, selectedOrgId]
  );

  const selectedMembers = useMemo(() => {
    return organizationMembers[selectedOrgId] || [];
  }, [organizationMembers, selectedOrgId]);

  const ownedOrganization = useMemo(() => {
    return organizations.find((organization) => organization.ownerId === user?.id);
  }, [organizations, user?.id]);

  const canCreateOrganization = !ownedOrganization;

  const loadPageData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [meRes, orgRes] = await Promise.all([api.getMe(), api.getOrganizations()]);

      if (meRes?.user) {
        const merged = {
          ...defaultProfile,
          ...meRes.user,
        };
        setProfile(merged);
        localStorage.setItem('user', JSON.stringify(meRes.user));
        onUserChange(meRes.user);
      }

      if (Array.isArray(orgRes)) {
        const normalizedOrganizations = orgRes.map((organization) => ({
          ...organization,
          plan: organization.plan || 'free',
        }));
        setOrganizations(normalizedOrganizations);
        if (normalizedOrganizations.length > 0) {
          const defaultOrganization =
            normalizedOrganizations.find((organization) => organization.ownerId === user.id) || normalizedOrganizations[0];
          setSelectedOrgId((prev) => prev || defaultOrganization.id);
        }
      }
    } catch (error) {
      showToast({ message: 'Failed to load profile settings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizationMembers = async (organizationId) => {
    if (!organizationId) return;
    try {
      const members = await api.getOrganizationMembers(organizationId);
      if (Array.isArray(members)) {
        setOrganizationMembers((prev) => ({
          ...prev,
          [organizationId]: members,
        }));
      }
    } catch (error) {
      showToast({ message: 'Failed to load organization members', type: 'error' });
    }
  };

  useEffect(() => {
    loadPageData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedOrgId && !organizationMembers[selectedOrgId]) {
      loadOrganizationMembers(selectedOrgId);
    }
  }, [selectedOrgId, organizationMembers]);

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

  const handleCreateOrganization = async (event) => {
    event.preventDefault();

    if (!canCreateOrganization) {
      showToast({ message: 'You can create only one organization per account', type: 'error' });
      return;
    }

    setIsCreatingOrg(true);

    try {
      const response = await api.createOrganization(newOrgName, newOrgPlan);
      if (response.error) {
        throw new Error(response.error);
      }

      setOrganizations((prev) => [response, ...prev]);
      setSelectedOrgId(response.id);
      setNewOrgName('');
      setNewOrgPlan('free');

      showToast({ message: 'Organization created', type: 'success' });
    } catch (error) {
      showToast({ message: error.message || 'Failed to create organization', type: 'error' });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    if (!selectedOrgId) return;

    setIsAddingMember(true);
    try {
      const response = await api.addOrganizationMember(selectedOrgId, memberEmail, memberRole);
      if (response.error) {
        throw new Error(response.error);
      }

      setMemberEmail('');
      setMemberRole('member');
      await Promise.all([loadOrganizationMembers(selectedOrgId), loadPageData()]);
      showToast({ message: 'Member assigned to organization', type: 'success' });
    } catch (error) {
      showToast({ message: error.message || 'Failed to add member', type: 'error' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handlePlanUpdate = async (organizationId, plan) => {
    try {
      const response = await api.updateOrganizationPlan(organizationId, plan);
      if (response.error) {
        throw new Error(response.error);
      }

      setOrganizations((prev) =>
        prev.map((organization) => (organization.id === organizationId ? { ...organization, ...response } : organization))
      );

      showToast({ message: `Plan updated to ${plan}`, type: 'success' });
    } catch (error) {
      showToast({ message: error.message || 'Failed to update plan', type: 'error' });
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

      <main className="settings-content">
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

        <section className="settings-card">
          <div className="settings-card-head">
            <h2>Organizations</h2>
            <span className="settings-pill">
              <Building2 size={14} /> Team Management
            </span>
          </div>
          <p>Create one organization, default plan is Free, and switch to Business anytime.</p>

          <form onSubmit={handleCreateOrganization} className="settings-inline-form">
            <div className="form-group">
              <label>Organization Name</label>
              <input
                required
                disabled={!canCreateOrganization}
                value={newOrgName}
                onChange={(event) => setNewOrgName(event.target.value)}
                placeholder="Acme Platform Team"
              />
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select
                disabled={!canCreateOrganization}
                value={newOrgPlan}
                onChange={(event) => setNewOrgPlan(event.target.value)}
              >
                {planOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isCreatingOrg || isLoading || !canCreateOrganization}
            >
              {isCreatingOrg ? 'Creating...' : 'Create Team'}
            </button>
          </form>

          {!canCreateOrganization && (
            <p className="muted">You already own an organization. Only one organization can be created per account.</p>
          )}

          {organizations.length > 0 && (
            <div className="organization-selector-row">
              {organizations.map((organization) => (
                <button
                  key={organization.id}
                  className={`organization-chip ${selectedOrgId === organization.id ? 'active' : ''}`}
                  onClick={() => setSelectedOrgId(organization.id)}
                  type="button"
                >
                  {organization.plan === 'business' ? <Crown size={13} /> : <Sparkles size={13} />} {organization.name}
                </button>
              ))}
            </div>
          )}

          {selectedOrganization && (
            <div className="organization-panel">
              <div className="organization-plan-row">
                <div>
                  <strong>{selectedOrganization.name}</strong>
                  <p>
                    {selectedOrganization.memberCount || selectedMembers.length} / {selectedOrganization.seatLimit} seats used
                  </p>
                </div>
                <div className="organization-plan-controls">
                  <select
                    value={selectedOrganization.plan || 'free'}
                    onChange={(event) => handlePlanUpdate(selectedOrganization.id, event.target.value)}
                  >
                    {planOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <form onSubmit={handleAddMember} className="settings-inline-form assign-form">
                <div className="form-group">
                  <label>Add Member by Email</label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    placeholder="member@company.com"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={memberRole} onChange={(event) => setMemberRole(event.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={isAddingMember}>
                  <UserPlus size={14} /> {isAddingMember ? 'Assigning...' : 'Assign User'}
                </button>
              </form>

              <div className="member-list">
                <div className="member-list-title">
                  <Users size={14} /> Members
                </div>
                {selectedMembers.length === 0 && <p className="muted">No members added yet.</p>}
                {selectedMembers.map((member) => (
                  <div key={member.id} className="member-row">
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.email}</p>
                    </div>
                    <span className="member-role">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {organizations.length === 0 && !isLoading && (
            <p className="muted">Create your first organization to start assigning teammates.</p>
          )}
        </section>
      </main>
    </div>
  );
}
