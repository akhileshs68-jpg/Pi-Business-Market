/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Award, 
  ShoppingBag, 
  Store, 
  Users, 
  Star, 
  Heart, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Share2, 
  MessageSquare, 
  Calendar, 
  ThumbsUp, 
  Filter, 
  PlusCircle, 
  Lock, 
  BadgeCheck, 
  MapPin, 
  Activity, 
  TrendingUp, 
  Coins,
  Loader2,
  Users2,
  ChevronRight,
  User,
  HeartHandshake,
  GraduationCap,
  Stethoscope,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useAuth } from '../auth/useAuth';
import { gamificationService, UserGamificationProfile, BadgeInfo } from '../services/gamificationService';
import { communityService, CommunityPost, CommunityComment, EnterpriseReputation, CommunityEvent } from '../services/communityService';
import { DailyCheckInCard } from '../components/rewards/DailyCheckInCard';
import { LevelProgressCard } from '../components/rewards/LevelProgressCard';
import { LeaderboardView } from '../components/rewards/LeaderboardView';
import { MissionsList } from '../components/rewards/MissionsList';
import { BadgesGrid } from '../components/rewards/BadgesGrid';

export const CommunityHub: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [reputation, setReputation] = useState<EnterpriseReputation | null>(null);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPost['communityType']>('Buyer');
  const [selectedCategory, setSelectedCategory] = useState<CommunityPost['category'] | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postCategory, setPostCategory] = useState<CommunityPost['category']>('announcement');
  const [formError, setFormError] = useState<string | null>(null);

  // Comment form state
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  // Tab views
  const [activeHubSection, setActiveHubSection] = useState<'feed' | 'leaderboard' | 'missions' | 'badges' | 'events'>('feed');
  const [reputationModalOpen, setReputationModalOpen] = useState(false);

  // Load overall community details
  useEffect(() => {
    loadCommunityData();
  }, [selectedCommunity, selectedCategory]);

  const loadCommunityData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uProfile = await gamificationService.getUserProfile(user.uid);
      setProfile(uProfile);

      const uRep = await communityService.calculateReputation(user.uid);
      setReputation(uRep);

      const uFeed = await communityService.getFeed(selectedCommunity, selectedCategory);
      setFeed(uFeed);

      const uEvents = await communityService.getEvents();
      setEvents(uEvents);
    } catch (err) {
      console.error('Failed to load community details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = async () => {
    if (!user) return;
    try {
      const uProfile = await gamificationService.getUserProfile(user.uid);
      setProfile(uProfile);
      const uRep = await communityService.calculateReputation(user.uid);
      setReputation(uRep);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!postTitle.trim() || !postBody.trim()) {
      setFormError('Please complete both title and content body.');
      return;
    }

    setSubmittingPost(true);
    setFormError(null);

    try {
      const authorName = user.displayName || user.email?.split('@')[0] || 'Anonymous Pioneer';
      const authorRole = profile.level >= 5 ? 'Business Leader' : profile.level >= 3 ? 'Merchant' : 'Buyer';

      await communityService.createPost(
        user.uid,
        authorName,
        authorRole,
        postTitle.trim(),
        postBody.trim(),
        postCategory,
        selectedCommunity
      );

      // Reset form
      setPostTitle('');
      setPostBody('');
      setPostCategory('announcement');

      // Celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });

      // Reload feed
      const uFeed = await communityService.getFeed(selectedCommunity, selectedCategory);
      setFeed(uFeed);
      await handleProfileUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish community post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    try {
      const { liked, likesCount } = await communityService.toggleLike(user.uid, postId);
      setFeed(prev => prev.map(p => {
        if (p.postId === postId) {
          const likedBy = liked 
            ? [...(p.likedBy || []), user.uid]
            : (p.likedBy || []).filter(id => id !== user.uid);
          return { ...p, likesCount, likedBy };
        }
        return p;
      }));
    } catch (e) {
      console.warn('Like toggle failed', e);
    }
  };

  const handleShare = async (postId: string) => {
    if (!user) return;
    try {
      await communityService.incrementShareCount(user.uid, postId);
      setFeed(prev => prev.map(p => {
        if (p.postId === postId) {
          return { ...p, sharesCount: (p.sharesCount || 0) + 1 };
        }
        return p;
      }));
      alert('Community link copied! Shared on Pi feed.');
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !profile) return;
    const text = commentText[postId] || '';
    if (!text.trim()) return;

    try {
      const authorName = user.displayName || user.email?.split('@')[0] || 'Anonymous Pioneer';
      const authorRole = profile.level >= 5 ? 'Business Leader' : profile.level >= 3 ? 'Merchant' : 'Buyer';

      const newComment = await communityService.addComment(
        postId,
        user.uid,
        authorName,
        authorRole,
        text.trim()
      );

      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setFeed(prev => prev.map(p => {
        if (p.postId === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment],
            commentsCount: (p.commentsCount || 0) + 1
          };
        }
        return p;
      }));
      await handleProfileUpdated();
    } catch (e) {
      console.warn(e);
    }
  };

  const communityCategories: { id: CommunityPost['communityType']; label: string; icon: any; color: string }[] = [
    { id: 'Buyer', label: 'Buyer Community', icon: ShoppingBag, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { id: 'Seller', label: 'Seller Community', icon: Store, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'Business', label: 'Business Community', icon: Activity, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { id: 'Professional', label: 'Professional Community', icon: User, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'NGO', label: 'NGO Community', icon: HeartHandshake, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { id: 'Education', label: 'Education Community', icon: GraduationCap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'Healthcare', label: 'Healthcare Community', icon: Stethoscope, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
  ];

  const postCategories: { id: CommunityPost['category']; label: string }[] = [
    { id: 'announcement', label: 'Announcement' },
    { id: 'business_update', label: 'Business Update' },
    { id: 'store_update', label: 'Store Update' },
    { id: 'product_launch', label: 'Product Launch' },
    { id: 'service_launch', label: 'Service Launch' },
    { id: 'achievement', label: 'Achievement' },
    { id: 'milestone', label: 'Milestone' },
    { id: 'festival_greeting', label: 'Festival Greeting' },
    { id: 'highlight', label: 'Community Highlight' },
    { id: 'educational', label: 'Educational Post' },
    { id: 'pi_news', label: 'Pi Ecosystem News' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* UPPER HEADLINE */}
        <div className="relative p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Pi Business Community Engine v3.0
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Token Ready
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">
                Enterprise Community Hub
              </h1>
              <p className="text-sm text-slate-400 font-medium max-w-2xl mt-2">
                Unified marketplace community networking platform. Earn BMP rewards for high-integrity posts, building verified reputation levels, and following peer merchants.
              </p>
            </div>

            {/* Overall ecosystem stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-8">
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Communities</span>
                <span className="text-lg font-black text-white">7 Active</span>
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Reputation Cap</span>
                <span className="text-lg font-black text-amber-400">1000 Pts</span>
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">P2P Escrow</span>
                <span className="text-lg font-black text-indigo-400">Secure</span>
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">DAO Governance</span>
                <span className="text-lg font-black text-emerald-400">Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE & REPUTATION OVERVIEW GRID */}
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Level & Streak progress */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LevelProgressCard profile={profile} />
                <DailyCheckInCard profile={profile} onProfileUpdated={handleProfileUpdated} />
              </div>
            </div>

            {/* Enterprise Reputation score overview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Enterprise Reputation
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-lg">
                    Tamper-Proof
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    {reputation?.score || 50}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    / 1000 Points
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider rounded-xl">
                    {reputation?.levelName || 'Bronze Pioneer'}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {reputation?.rating?.toFixed(1) || '4.8'} Verification Rate
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-6">
                  Reputation is dynamically calculated across order completions, verified feedback, merchant delivery times, referral quality, and account age.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setReputationModalOpen(true)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  View Score Breakdown <ChevronRight className="w-4 h-4" />
                </button>

                {/* Blockchain metadata */}
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                  <Coins className="w-3 h-3 text-amber-500/70" /> On-Chain Reputation Mapping Ready
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SYSTEM STATUS AND WARNINGS */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0" />
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            <span className="text-white font-bold">Anti-Cheat Enabled:</span> The BMP reward engine runs real-time transaction level anti-cheat verifications. Click spamming, fake account engagement, and self-referrals automatically trigger penalty deductions.
          </p>
        </div>

        {/* COMMUNITIES SELECTOR / NAVIGATION */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users2 className="w-4 h-4" /> Active Sub-Community Hubs
          </h3>
          <div className="flex flex-wrap gap-2">
            {communityCategories.map((comm) => {
              const Icon = comm.icon;
              const isSelected = selectedCommunity === comm.id;
              return (
                <button
                  key={comm.id}
                  onClick={() => setSelectedCommunity(comm.id)}
                  className={`px-4 py-3 rounded-2xl border font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900/50 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : comm.color.split(' ')[0]}`} />
                  <span>{comm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COMMUNITY SECTIONS NAVIGATION TAB */}
        <div className="border-b border-slate-800/80 flex flex-wrap gap-6 text-sm font-black uppercase">
          {(['feed', 'leaderboard', 'missions', 'badges', 'events'] as const).map((sec) => {
            const isActive = activeHubSection === sec;
            return (
              <button
                key={sec}
                onClick={() => setActiveHubSection(sec)}
                className={`pb-3 relative transition-all tracking-wider ${
                  isActive ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sec}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT / CENTER WORKPLACE - FEED or OTHER SELECTED MODULE */}
          <div className="lg:col-span-2 space-y-6">

            <AnimatePresence mode="wait">
              
              {activeHubSection === 'feed' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  
                  {/* Category filters */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/80">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        selectedCategory === 'All'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Topics
                    </button>
                    {postCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Create post form */}
                  <form onSubmit={handleCreatePost} className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-indigo-400" /> Publish in {selectedCommunity} Hub
                    </h3>

                    {formError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Post Title</label>
                        <input
                          type="text"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          placeholder="Announce storefront updates, milestone achievements..."
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Topic Category</label>
                        <select
                          value={postCategory}
                          onChange={(e) => setPostCategory(e.target.value as CommunityPost['category'])}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all"
                        >
                          {postCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Post Content</label>
                      <textarea
                        value={postBody}
                        onChange={(e) => setPostBody(e.target.value)}
                        placeholder="Write dynamic updates or insights. Share details that build customer trust..."
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-xs text-white placeholder-slate-600 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 uppercase">
                        <Coins className="w-3.5 h-3.5" /> Earn +25 BMP for high-quality posts
                      </span>
                      <button
                        type="submit"
                        disabled={submittingPost}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                      >
                        {submittingPost ? 'Publishing...' : 'Publish Post'}
                      </button>
                    </div>
                  </form>

                  {/* Feed container */}
                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Feed...</p>
                    </div>
                  ) : feed.length === 0 ? (
                    <div className="p-12 border border-slate-800 border-dashed rounded-3xl text-center">
                      <p className="text-sm text-slate-500 font-bold">No community posts found matching this filter.</p>
                      <p className="text-xs text-slate-600 mt-1">Be the first to publish an announcement above!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feed.map((post) => {
                        const isLiked = user && post.likedBy?.includes(user.uid);
                        const displayCat = postCategories.find(c => c.id === post.category)?.label || post.category;
                        
                        return (
                          <div 
                            key={post.postId}
                            className={`p-6 bg-slate-900/80 border rounded-3xl space-y-4 transition-all ${
                              post.pinned ? 'border-amber-500/40 shadow-md shadow-amber-500/5' : 'border-slate-800'
                            }`}
                          >
                            
                            {/* Author info */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-black text-white uppercase">
                                  {post.authorName.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wide">
                                      {post.authorName}
                                    </h4>
                                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 text-[8px] font-black uppercase rounded">
                                      {post.authorRole}
                                    </span>
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase rounded">
                                      Lvl {post.authorLevel || 1}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {post.pinned && (
                                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-400" /> Pinned
                                  </span>
                                )}
                                <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg">
                                  {displayCat}
                                </span>
                              </div>
                            </div>

                            {/* Title & Body */}
                            <div className="space-y-1.5">
                              <h3 className="text-sm font-black text-white uppercase tracking-wide">{post.title}</h3>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-line">{post.body}</p>
                            </div>

                            {/* Interactive indicators */}
                            <div className="flex items-center gap-6 border-t border-slate-800/60 pt-4 text-slate-400">
                              <button 
                                onClick={() => handleToggleLike(post.postId)}
                                className={`flex items-center gap-2 hover:text-rose-400 transition-all ${isLiked ? 'text-rose-500' : ''}`}
                              >
                                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                                <span className="text-[10px] font-black uppercase tracking-wider">{post.likesCount || 0} Likes</span>
                              </button>

                              <button 
                                onClick={() => setCommentingPostId(commentingPostId === post.postId ? null : post.postId)}
                                className="flex items-center gap-2 hover:text-white transition-all"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">{post.comments?.length || 0} Comments</span>
                              </button>

                              <button 
                                onClick={() => handleShare(post.postId)}
                                className="flex items-center gap-2 hover:text-white transition-all"
                              >
                                <Share2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">{post.sharesCount || 0} Shares</span>
                              </button>
                            </div>

                            {/* Comments Section */}
                            {commentingPostId === post.postId && (
                              <div className="border-t border-slate-800/80 pt-4 space-y-4">
                                
                                {/* Comments list */}
                                {post.comments && post.comments.length > 0 && (
                                  <div className="space-y-3">
                                    {post.comments.map((comm) => (
                                      <div key={comm.commentId} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/50 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-white uppercase">{comm.authorName}</span>
                                            <span className="px-1.5 py-0.2 bg-slate-900 text-slate-500 text-[8px] font-black uppercase rounded">
                                              {comm.authorRole}
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-medium text-slate-600">
                                            {new Date(comm.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">{comm.body}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add comment form */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={commentText[post.postId] || ''}
                                    onChange={(e) => setCommentText(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                    placeholder="Add constructive reply..."
                                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all"
                                  />
                                  <button
                                    onClick={() => handleAddComment(post.postId)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </motion.div>
              )}

              {activeHubSection === 'leaderboard' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <LeaderboardView />
                </motion.div>
              )}

              {activeHubSection === 'missions' && profile && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <MissionsList profile={profile} onProfileUpdated={handleProfileUpdated} />
                </motion.div>
              )}

              {activeHubSection === 'badges' && profile && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <BadgesGrid profile={profile} />
                </motion.div>
              )}

              {activeHubSection === 'events' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-4"
                >
                  <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-indigo-400" /> Community Events & Campaigns
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Participate in verified challenges to win high value BMP token vouchers and on-chain badges.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((evt) => (
                      <div key={evt.eventId} className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-col justify-between h-56 transition-all hover:border-slate-700">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[8px] font-black uppercase tracking-widest text-indigo-400 rounded">
                              {evt.type}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              To: {evt.targetCommunity}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">{evt.title}</h4>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3">{evt.description}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {evt.participantCount} Pioneers Active
                          </span>

                          <button 
                            onClick={() => {
                              alert(`Registered for "${evt.title}" successfully! Complete objectives to earn tokens.`);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1"
                          >
                            Join Event <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </motion.div>
              )}

            </AnimatePresence>

          </div>

          {/* RIGHT WORKPLACE - SIDEBAR COMPONENT FOR COMMUNITY ENGAGEMENTS */}
          <div className="space-y-6">
            
            {/* Blockchain Compatibility Banner */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" /> Blockchain Compatibility
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                The Pi Business Community Engine is prepared for on-chain mainnet synchronization. Track metadata tags and future DAO structures.
              </p>

              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>BMP Token Contract</span>
                  <span className="text-slate-400 font-mono">P6b...78a</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>On-chain Reputation Integration</span>
                  <span className="px-2 py-0.2 bg-slate-950 border border-slate-800 text-[8px] font-black text-indigo-400 uppercase rounded">Pending Mainnet</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>DAO Governance Contracts</span>
                  <span className="px-2 py-0.2 bg-slate-950 border border-slate-800 text-[8px] font-black text-indigo-400 uppercase rounded">Future</span>
                </div>
              </div>
            </div>

            {/* Quick business verification notice */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Verify Your Storefront</h4>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Receive the blue verification tick badge on your posts, unlock professional category filters, and gain <span className="text-white font-bold">+150 Reputation points</span>.
              </p>
              <button
                onClick={() => alert('Navigate to Business Profile Settings to upload verification documentation.')}
                className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Apply for Verification
              </button>
            </div>

            {/* Top Categories sidebar list */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Quick-Follow Categories
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold mb-2">Subscribe to specific feeds and campaigns</p>

              <div className="space-y-2">
                {[
                  { name: 'NGO Campaigns', count: 124, slug: 'ngo' },
                  { name: 'Educational Events', count: 98, slug: 'education' },
                  { name: 'Healthcare Offers', count: 75, slug: 'healthcare' },
                  { name: 'Startup Launches', count: 215, slug: 'business' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-300 uppercase">{item.name}</span>
                      <span className="text-[9px] text-slate-600 font-bold">{item.count} Followers</span>
                    </div>

                    <button 
                      onClick={() => alert(`Subscribed to "${item.name}"!`)}
                      className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[9px] font-black uppercase rounded-lg transition-all"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* REPUTATION BREAKDOWN MODAL */}
      {reputationModalOpen && reputation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Reputation Score Breakdown
              </h3>
              <button 
                onClick={() => setReputationModalOpen(false)}
                className="text-slate-500 hover:text-white font-black text-lg outline-none"
              >
                ×
              </button>
            </div>

            <div className="flex items-baseline gap-2 border-b border-slate-800/80 pb-4">
              <span className="text-4xl font-black text-white">{reputation.score}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">/ 1000 Total Reputation Points</span>
            </div>

            {/* Score bars breakdown */}
            <div className="space-y-4">
              {[
                { label: 'Completed Orders', value: reputation.breakdown.completedOrdersScore, max: 300, color: 'bg-emerald-500' },
                { label: 'Verified Reviews Given/Received', value: reputation.breakdown.reviewsScore, max: 200, color: 'bg-indigo-500' },
                { label: 'Customer Satisfaction Index', value: reputation.breakdown.satisfactionScore, max: 150, color: 'bg-sky-500' },
                { label: 'Official Business Verification', value: reputation.breakdown.verificationScore, max: 150, color: 'bg-blue-500' },
                { label: 'Successful Merchant Sales', value: reputation.breakdown.deliveriesScore, max: 200, color: 'bg-amber-500' },
                { label: 'Community Hub Participation', value: reputation.breakdown.communityParticipationScore, max: 100, color: 'bg-rose-500' },
                { label: 'Referral Quality Score', value: reputation.breakdown.referralsScore, max: 100, color: 'bg-purple-500' },
                { label: 'Account Age & Loyalty', value: reputation.breakdown.accountAgeScore, max: 100, color: 'bg-cyan-500' }
              ].map((bar, idx) => {
                const percent = Math.min(100, Math.round((bar.value / bar.max) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">{bar.label}</span>
                      <span className="text-white">{bar.value} / {bar.max} pts</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                      <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setReputationModalOpen(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Done
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
