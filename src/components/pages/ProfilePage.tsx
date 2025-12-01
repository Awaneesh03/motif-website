import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  Camera,
  Users,
  Lightbulb,
  BookOpen,
  Mail,
  Linkedin,
  ThumbsUp,
  CheckCircle2,
  Shield,
  Bell,
  Trash2,
  Upload,
  X,
  Smile,
  MessageCircle,
  Send,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

// Mock user data
const mockUser = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  about:
    'Founder & entrepreneur passionate about AI, SaaS, and building products that matter. Always looking to connect with fellow innovators.',
  linkedin: 'https://linkedin.com/in/alexjohnson',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  connections: 342,
  ideasSaved: 28,
  caseStudiesSaved: 15,
};

const upvotedIdeas = [
  {
    id: 1,
    title: 'AI-powered meal planning app for busy professionals',
    date: '2024-11-05',
    upvotes: 234,
  },
  {
    id: 2,
    title: 'Blockchain-based freelancer marketplace with escrow',
    date: '2024-11-03',
    upvotes: 189,
  },
  {
    id: 3,
    title: 'No-code platform for building internal tools',
    date: '2024-11-01',
    upvotes: 156,
  },
  {
    id: 4,
    title: 'Virtual reality training platform for medical students',
    date: '2024-10-28',
    upvotes: 142,
  },
  {
    id: 5,
    title: 'Sustainable packaging marketplace for e-commerce',
    date: '2024-10-25',
    upvotes: 128,
  },
];

const solvedCases = [
  {
    id: 1,
    title: 'Uber - Urban Transportation Disruption',
    completedDate: '2024-11-04',
    difficulty: 'Advanced',
    score: 95,
  },
  {
    id: 2,
    title: 'Airbnb - Trust in Peer-to-Peer Marketplace',
    completedDate: '2024-10-30',
    difficulty: 'Advanced',
    score: 88,
  },
  {
    id: 3,
    title: 'Spotify - Music Streaming Revolution',
    completedDate: '2024-10-22',
    difficulty: 'Intermediate',
    score: 92,
  },
  {
    id: 4,
    title: 'Slack - Team Communication Platform',
    completedDate: '2024-10-18',
    difficulty: 'Beginner',
    score: 100,
  },
];

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

const emojis = [
  '😊',
  '🚀',
  '💡',
  '🎯',
  '⭐',
  '🔥',
  '💪',
  '🌟',
  '🎨',
  '🧠',
  '👨‍💼',
  '👩‍💼',
  '🦄',
  '🌈',
  '⚡',
];

const mockConnections = [
  {
    id: 1,
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    lastMessage: 'That sounds like a great idea!',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: 'Mike Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    lastMessage: 'Let\'s schedule a call',
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: 'Emma Thompson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    lastMessage: 'Thanks for the feedback!',
    unread: 1,
    online: true,
  },
];

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [user, setUser] = useState(mockUser);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    about: user.about,
    linkedin: user.linkedin,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Settings state (removed darkMode)
  const [settings, setSettings] = useState({
    makeIdeasPublic: true,
    emailUpdates: true,
    aiInsights: true,
  });

  const handleSaveProfile = () => {
    setUser({
      ...user,
      ...editForm,
    });
    setIsEditOpen(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      email: user.email,
      about: user.about,
      linkedin: user.linkedin,
    });
    setIsEditOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Intermediate':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Advanced':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success('Settings saved');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    toast.success('Account deletion request submitted');
  };

  const handleAvatarChange = (type: 'emoji' | 'upload' | 'remove') => {
    if (type === 'emoji' && selectedEmoji) {
      setUser({ ...user, avatar: '' }); // Would set emoji as avatar
      toast.success('Profile picture updated to emoji');
      setIsAvatarModalOpen(false);
    } else if (type === 'upload') {
      toast.info('File upload would be handled here');
      setIsAvatarModalOpen(false);
    } else if (type === 'remove') {
      setUser({ ...user, avatar: '' });
      toast.success('Profile picture removed');
      setIsAvatarModalOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && selectedConnection) {
      toast.success('Message sent!');
      setChatMessage('');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className="border-border/50 relative mb-8 overflow-hidden shadow-lg"
            style={{
              background:
                'linear-gradient(135deg, rgba(181, 199, 255, 0.05) 0%, rgba(162, 108, 253, 0.05) 100%)',
            }}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                {/* Profile Picture */}
                <div className="group relative">
                  <Avatar
                    className="h-32 w-32 border-4"
                    style={{ borderColor: 'rgba(181, 199, 255, 0.3)' }}
                  >
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-3xl">
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h1 className="mb-2 text-3xl" style={{ color: '#D8E0FF' }}>
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground mb-4 max-w-2xl">{user.about}</p>
                </div>

                {/* Edit Button */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="gradient-lavender shadow-lavender rounded-[16px] px-6 hover:opacity-90"
                      style={{ boxShadow: '0 0 12px rgba(165, 187, 255, 0.25)' }}
                    >
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information and social links.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="about">About</Label>
                        <Textarea
                          id="about"
                          rows={4}
                          value={editForm.about}
                          onChange={e => setEditForm({ ...editForm, about: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn Profile</Label>
                        <Input
                          id="linkedin"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={editForm.linkedin}
                          onChange={e => setEditForm({ ...editForm, linkedin: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={handleCancel} className="rounded-[16px]">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="gradient-lavender shadow-lavender rounded-[16px] hover:opacity-90"
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <Card
            className="border-border/50 shadow-md transition-shadow hover:shadow-lg"
            style={{ background: 'rgba(180, 200, 255, 0.05)' }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(181, 199, 255, 0.15)' }}
                >
                  <Users className="text-primary h-8 w-8" />
                </div>
                <div>
                  <p className="mb-1 text-3xl">{user.connections}</p>
                  <p className="text-muted-foreground">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-border/50 shadow-md transition-shadow hover:shadow-lg"
            style={{ background: 'rgba(180, 200, 255, 0.05)' }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(181, 199, 255, 0.15)' }}
                >
                  <Lightbulb className="text-secondary h-8 w-8" />
                </div>
                <div>
                  <p className="mb-1 text-3xl">{user.ideasSaved}</p>
                  <p className="text-muted-foreground">Ideas Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-border/50 shadow-md transition-shadow hover:shadow-lg"
            style={{ background: 'rgba(180, 200, 255, 0.05)' }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(181, 199, 255, 0.15)' }}
                >
                  <BookOpen className="text-accent h-8 w-8" />
                </div>
                <div>
                  <p className="mb-1 text-3xl">{user.caseStudiesSaved}</p>
                  <p className="text-muted-foreground">Cases Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* History Section - Tabbed View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card
              className="border-border/50 shadow-lg"
              style={{ background: 'rgba(180, 200, 255, 0.05)' }}
            >
              <CardHeader>
                <CardTitle style={{ color: '#D8E0FF' }}>Activity History & Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ideas" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-3">
                    <TabsTrigger
                      value="ideas"
                      style={{ borderBottom: '2px solid transparent' }}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-[rgba(181,199,255,0.6)]"
                    >
                      Ideas
                    </TabsTrigger>
                    <TabsTrigger
                      value="cases"
                      style={{ borderBottom: '2px solid transparent' }}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-[rgba(181,199,255,0.6)]"
                    >
                      Cases
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      style={{ borderBottom: '2px solid transparent' }}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-[rgba(181,199,255,0.6)]"
                    >
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ideas" className="space-y-3">
                    {upvotedIdeas.map(idea => (
                      <div
                        key={idea.id}
                        onClick={() => {
                          // Navigate to idea analyser with idea details
                          onNavigate?.('Idea Analyser');
                          toast.info('Opening idea details...');
                        }}
                        className="border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer rounded-xl border p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="mb-2 hover:text-primary transition-colors">{idea.title}</h4>
                            <div className="text-muted-foreground flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                {idea.upvotes} upvotes
                              </span>
                              <span>{formatDate(idea.date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="cases" className="space-y-3">
                    {solvedCases.map(caseStudy => (
                      <div
                        key={caseStudy.id}
                        onClick={() => {
                          // Navigate to Case Studies page with results
                          onNavigate?.('Case Studies');
                          toast.info('Loading case study results...');
                        }}
                        className="border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer rounded-xl border p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <h4 className="hover:text-primary transition-colors">{caseStudy.title}</h4>
                              <Badge
                                variant="outline"
                                className={`${getDifficultyColor(caseStudy.difficulty)} rounded-full`}
                              >
                                {caseStudy.difficulty}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Score: {caseStudy.score}%
                              </span>
                              <span>{formatDate(caseStudy.completedDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    {/* Privacy Section */}
                    <div className="space-y-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Shield className="text-primary h-5 w-5" />
                        <h4>Privacy</h4>
                      </div>
                      <div className="bg-muted/30 flex items-center justify-between rounded-xl p-4">
                        <div>
                          <p className="mb-1">Make my ideas public</p>
                          <p className="text-muted-foreground text-sm">
                            Allow others to see your submitted ideas
                          </p>
                        </div>
                        <Switch
                          checked={settings.makeIdeasPublic}
                          onCheckedChange={() => handleSettingChange('makeIdeasPublic')}
                        />
                      </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="space-y-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Bell className="text-primary h-5 w-5" />
                        <h4>Notifications</h4>
                      </div>
                      <div className="bg-muted/30 flex items-center justify-between rounded-xl p-4">
                        <div>
                          <p className="mb-1">Email updates</p>
                          <p className="text-muted-foreground text-sm">
                            Receive email notifications about your activity
                          </p>
                        </div>
                        <Switch
                          checked={settings.emailUpdates}
                          onCheckedChange={() => handleSettingChange('emailUpdates')}
                        />
                      </div>
                      <div className="bg-muted/30 flex items-center justify-between rounded-xl p-4">
                        <div>
                          <p className="mb-1">AI insights</p>
                          <p className="text-muted-foreground text-sm">
                            Get AI-powered tips and recommendations
                          </p>
                        </div>
                        <Switch
                          checked={settings.aiInsights}
                          onCheckedChange={() => handleSettingChange('aiInsights')}
                        />
                      </div>
                    </div>

                    {/* Account Section */}
                    <div className="space-y-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Shield className="text-primary h-5 w-5" />
                        <h4>Account</h4>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-xl hover:bg-primary/10 hover:border-primary/50 hover:text-foreground transition-all"
                        >
                          Change Password
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50 w-full justify-start rounded-xl transition-all"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6 lg:col-span-1"
          >
            <Card
              className="border-border/50 shadow-lg"
              style={{ background: 'rgba(180, 200, 255, 0.05)' }}
            >
              <CardHeader>
                <CardTitle style={{ color: '#D8E0FF' }}>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-xl p-3 transition-colors">
                  <div
                    className="rounded-lg p-2"
                    style={{ background: 'rgba(181, 199, 255, 0.15)' }}
                  >
                    <Mail className="text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground mb-1 text-sm">Email</p>
                    <a
                      href={`mailto:${user.email}`}
                      className="hover:text-primary block truncate text-sm transition-colors"
                    >
                      {user.email}
                    </a>
                  </div>
                </div>

                <div className="bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-xl p-3 transition-colors">
                  <div
                    className="rounded-lg p-2"
                    style={{ background: 'rgba(181, 199, 255, 0.15)' }}
                  >
                    <Linkedin className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground mb-1 text-sm">LinkedIn</p>
                    <a
                      href={user.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-blue-500 transition-colors hover:text-blue-600"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl hover:bg-primary/10 hover:border-primary/50 hover:text-foreground transition-all"
                  onClick={() => onNavigate?.('Community')}
                >
                  Browse Community
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl hover:bg-primary/10 hover:border-primary/50 hover:text-foreground transition-all"
                  onClick={() => onNavigate?.('Case Studies')}
                >
                  Explore Case Studies
                </Button>
              </CardContent>
            </Card>

            {/* Personal Chat Section */}
            <Card
              className="border-border/50 shadow-lg"
              style={{ background: 'rgba(180, 200, 255, 0.05)' }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="text-primary h-5 w-5" />
                  <span style={{ color: '#D8E0FF' }}>Connections Chat</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Connections List */}
                <div className="space-y-2">
                  {mockConnections.map(connection => (
                    <div
                      key={connection.id}
                      onClick={() => setSelectedConnection(connection.id)}
                      className={`border-border/50 hover:bg-primary/5 cursor-pointer rounded-xl border p-3 transition-all ${
                        selectedConnection === connection.id ? 'bg-primary/10 border-primary/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={connection.avatar} alt={connection.name} />
                            <AvatarFallback>
                              {connection.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          {connection.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium">{connection.name}</p>
                            {connection.unread > 0 && (
                              <Badge className="h-5 w-5 rounded-full bg-primary p-0 text-xs">
                                {connection.unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground truncate text-xs">
                            {connection.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                {selectedConnection && (
                  <div className="border-border/50 space-y-3 rounded-xl border p-4">
                    <p className="text-sm font-medium">
                      Chat with{' '}
                      {mockConnections.find(c => c.id === selectedConnection)?.name}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        className="rounded-xl"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all
              your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleDeleteAccount}
            >
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Picture Modal */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
            <DialogDescription>
              Choose an emoji, upload a photo, or remove your current picture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Option 1: Choose Emoji */}
            <div>
              <Label className="mb-3 block">Choose an Emoji</Label>
              <div className="grid grid-cols-5 gap-2">
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`hover:bg-primary/10 rounded-xl border-2 p-3 text-3xl transition-colors ${
                      selectedEmoji === emoji
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {selectedEmoji && (
                <Button
                  onClick={() => handleAvatarChange('emoji')}
                  className="gradient-lavender shadow-lavender mt-3 w-full rounded-xl hover:opacity-90"
                >
                  <Smile className="mr-2 h-4 w-4" />
                  Use {selectedEmoji} as Avatar
                </Button>
              )}
            </div>

            {/* Option 2: Upload Photo */}
            <div>
              <Label className="mb-3 block">Upload Photo</Label>
              <Button
                variant="outline"
                onClick={() => handleAvatarChange('upload')}
                className="w-full rounded-xl"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <p className="text-muted-foreground mt-2 text-xs">
                Supported formats: JPG, PNG (Max 5MB)
              </p>
            </div>

            {/* Option 3: Remove Current */}
            <div>
              <Button
                variant="outline"
                onClick={() => handleAvatarChange('remove')}
                className="text-destructive hover:text-destructive w-full rounded-xl"
              >
                <X className="mr-2 h-4 w-4" />
                Remove Current Picture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
