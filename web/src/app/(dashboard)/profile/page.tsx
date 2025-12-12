// web/src/app/(dashboard)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  Loader2, User, Mail, Calendar, Shield, ArrowLeft, 
  Edit2, Save, X, AlertCircle, CheckCircle 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
          setFormData({
            name: data.data.name,
            username: data.data.username,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: profile.name,
      username: profile.username,
    });
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.data);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">
                Manage your account information
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header with Avatar */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <User size={40} className="text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{profile?.name}</h2>
                    <p className="text-primary-100">@{profile?.username}</p>
                  </div>
                  {!editing && (
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <User className="text-gray-400 mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Full Name</p>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter your name"
                          />
                        ) : (
                          <p className="font-semibold text-gray-900">{profile?.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <User className="text-gray-400 mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Username</p>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter username"
                          />
                        ) : (
                          <p className="font-semibold text-gray-900">@{profile?.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <Mail className="text-gray-400 mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Email Address</p>
                        <p className="font-semibold text-gray-900">{user?.email || 'Not available'}</p>
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <Shield className="text-gray-400 mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Role</p>
                        <span className="inline-flex px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full capitalize">
                          {profile?.role}
                        </span>
                      </div>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-gray-400 mt-1" size={20} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Member Since</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(profile?.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Actions */}
                {editing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={saving}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      loading={saving}
                      disabled={saving}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Campaigns Created</span>
                  <span className="font-bold text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Leads Scored</span>
                  <span className="font-bold text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="text-sm font-semibold text-primary-600 capitalize">{profile?.role}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link href="/campaigns/upload">
                  <Button variant="outline" className="w-full bg-white hover:bg-gray-50">
                    Upload Campaign
                  </Button>
                </Link>
                <Link href="/inference">
                  <Button variant="outline" className="w-full bg-white hover:bg-gray-50">
                    Quick Score
                  </Button>
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Contact support if you need assistance with your account.
              </p>
              <Button variant="outline" size="sm" className="w-full bg-white hover:bg-gray-50">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}