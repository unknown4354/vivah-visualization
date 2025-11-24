'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Palette,
  CreditCard,
  Shield,
  Download,
  Save,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  })

  // Update profile when user loads
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const [preferences, setPreferences] = useState({
    defaultView: '2D',
    gridSize: 1,
    snapToGrid: true,
    autoSave: true,
    emailNotifications: true,
    theme: 'light'
  })

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (res.ok) {
        // Show success toast
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (res.ok) {
        // Show success toast
      }
    } catch (error) {
      console.error('Failed to update preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'export', label: 'Data Export', icon: Download }
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Manage your account settings and preferences
        </p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                        placeholder="your@email.com"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profile.company}
                        onChange={e => setProfile({ ...profile, company: e.target.value })}
                        placeholder="Your company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>Editor Preferences</CardTitle>
                  <CardDescription>
                    Customize your editing experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultView">Default View</Label>
                      <select
                        id="defaultView"
                        value={preferences.defaultView}
                        onChange={e => setPreferences({ ...preferences, defaultView: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="2D">2D Floor Plan</option>
                        <option value="3D">3D View</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gridSize">Grid Size (meters)</Label>
                      <select
                        id="gridSize"
                        value={preferences.gridSize}
                        onChange={e => setPreferences({ ...preferences, gridSize: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value={0.25}>0.25m</option>
                        <option value={0.5}>0.5m</option>
                        <option value={1}>1m</option>
                        <option value={2}>2m</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Snap to Grid</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically align items to grid
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.snapToGrid}
                        onChange={e => setPreferences({ ...preferences, snapToGrid: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Save</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically save changes every 30 seconds
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.autoSave}
                        onChange={e => setPreferences({ ...preferences, autoSave: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <select
                        id="theme"
                        value={preferences.theme}
                        onChange={e => setPreferences({ ...preferences, theme: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>

                  <Button onClick={handleSavePreferences} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your projects via email
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={e => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <Label>Share Link Views</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone views your shared project
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive tips, updates, and promotional content
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'billing' && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>
                    Manage your subscription and payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Current Plan</span>
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                        Free
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      5 AI generations remaining this month
                    </p>
                    <Button variant="outline" className="w-full">
                      Upgrade to Pro
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Plan Features</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        1 active project
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        5 AI generations/month
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Basic export (PNG)
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <span>✗</span>
                        PDF export
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <span>✗</span>
                        Priority support
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your password and security options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Button>Update Password</Button>

                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back.
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'export' && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>
                    Download your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You can export all your project data, settings, and generated content.
                    The export will be delivered as a ZIP file.
                  </p>

                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Request Data Export
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Export requests typically complete within 24 hours.
                    You'll receive an email with a download link.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
