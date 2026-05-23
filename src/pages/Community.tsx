import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Tent, MapPin, Clock, Plus, Filter, Users, ChevronRight, Activity, BellRing, CheckCircle, X, Feather } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { useToast } from '../components/ToastProvider';

const FORUM_CATEGORIES = [
  { name: 'General', icon: <MessageSquare className="w-5 h-5 text-gray-500" />, active: true },
  { name: 'Donation Tips', icon: <Heart className="w-5 h-5 text-primary" />, active: false },
  { name: 'Health & Wellness', icon: <Activity className="w-5 h-5 text-accent" />, active: false },
  { name: 'Blood Bank News', icon: <Tent className="w-5 h-5 text-blue-500" />, active: false },
  { name: 'Emergency Support', icon: <BellRing className="w-5 h-5 text-warning" />, active: false },
];

const MIN_CHARS = 130;
const MAX_CHARS = 150;

const Community: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'Stories' | 'Forums' | 'Camps'>(() => {
    if (tabParam === 'Stories' || tabParam === 'Forums' || tabParam === 'Camps') return tabParam;
    return 'Stories';
  });

  useEffect(() => {
    if (tabParam === 'Stories' || tabParam === 'Forums' || tabParam === 'Camps') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [activeCategory, setActiveCategory] = useState('General');
  const [posts, setPosts] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [rsvpCamps, setRsvpCamps] = useState<Set<string>>(new Set());

  // Story Submission Modal state
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userRole = localStorage.getItem('liforce_role');
  const isLoggedIn = !!localStorage.getItem('liforce_token');

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const postsRes = await fetch(`${API_URL}/community/posts`);
        if (postsRes.ok) setPosts(await postsRes.json());

        const campsRes = await fetch(`${API_URL}/community/camps`);
        if (campsRes.ok) setCamps(await campsRes.json());
      } catch (err) {
        console.error('Failed to fetch community data', err);
      }
    };
    fetchCommunityData();
  }, []);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isStoryModalOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setStoryText('');
    }
  }, [isStoryModalOpen]);

  const handleShareStoryClick = () => {
    if (!isLoggedIn) {
      showToast('Please log in as a donor or blood bank to share your story.', 'error');
      return;
    }
    setIsStoryModalOpen(true);
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim()) {
      showToast('Please write something before submitting.', 'error');
      return;
    }
    if (storyText.trim().length < MIN_CHARS) {
      showToast(`Your story must be at least ${MIN_CHARS} characters.`, 'error');
      return;
    }
    if (storyText.trim().length > MAX_CHARS) {
      showToast(`Your story must be ${MAX_CHARS} characters or less.`, 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('liforce_token');
    try {
      const res = await fetch(`${API_URL}/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: storyText.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post your story.');
      }

      // Prepend the new post optimistically
      setPosts((prev) => [data, ...prev]);
      setIsStoryModalOpen(false);
      setStoryText('');
      showToast('🎉 Your story has been shared on the Gratitude Wall!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charsLeft = MAX_CHARS - storyText.length;
  const charsWarning = charsLeft < 10;
  const isTooShort = storyText.trim().length < MIN_CHARS;
  const isTooLong = storyText.length > MAX_CHARS;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navbar />

      {/* Header */}
      <div className="bg-surface border-b border-border py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 flex items-center">
            The LiForce Community
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            Read inspiring stories, discuss with fellow donors, or find upcoming camps to join our mission of saving lives.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-surface border-b border-border sticky top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {(['Stories', 'Forums', 'Camps'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-bold text-lg relative transition-colors ${
                  activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeCommunityTab"
                    className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">

          {/* STORIES TAB */}
          {activeTab === 'Stories' && (
            <motion.div
              key="stories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Gratitude Wall</h2>
                  <p className="text-sm text-text-secondary mt-1">Real stories from our community of donors and blood banks</p>
                </div>
                <button
                  type="button"
                  id="share-story-btn"
                  onClick={handleShareStoryClick}
                  className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-[0.97]"
                >
                  <Feather className="w-4 h-4" /> Share your story
                </button>
              </div>

              {/* CSS Masonry Layout */}
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {posts.map((story) => {
                  const initials = story.authorInitials || (story.authorName ? story.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?');
                  const isBloodBank = story.authorType === 'bloodbank';
                  return (
                    <div key={story.id} className="break-inside-avoid bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow relative group">
                      {/* Decorative heart */}
                      <Heart className="absolute top-5 right-5 w-7 h-7 text-[#F5B7B1] opacity-20 group-hover:opacity-40 transition-opacity" />
                      <p className="text-base text-text-primary italic mb-5 leading-relaxed relative z-10">
                        "{story.content}"
                      </p>
                      <div className="flex justify-between items-center border-t border-border pt-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isBloodBank ? 'bg-blue-100 text-blue-700' : 'bg-primary-light text-primary'}`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-text-primary">{story.authorName}</div>
                            <div className="text-[10px] text-text-secondary">{isBloodBank ? 'Blood Bank' : 'Donor'} · {new Date(story.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLikedPosts((prev) => new Set(prev).add(story.id));
                            showToast('Thanks for the love! ❤️', 'success');
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                            likedPosts.has(story.id)
                              ? 'bg-primary-light text-primary border-primary scale-105'
                              : 'text-text-secondary hover:text-primary bg-gray-50 border-border hover:border-primary hover:bg-primary-light'
                          }`}
                          disabled={likedPosts.has(story.id)}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedPosts.has(story.id) ? 'fill-primary' : ''}`} />
                          {story.likes + (likedPosts.has(story.id) ? 1 : 0)}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {posts.length === 0 && (
                  <div className="w-full text-center p-16 bg-surface rounded-2xl border border-dashed border-border">
                    <Feather className="w-12 h-12 text-text-secondary opacity-30 mx-auto mb-4" />
                    <p className="font-bold text-text-primary mb-1">No stories yet</p>
                    <p className="text-sm text-text-secondary">Be the first to share your experience on the Gratitude Wall!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* FORUMS TAB */}
          {activeTab === 'Forums' && (
            <motion.div
              key="forums"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              {/* Left Sidebar - Categories */}
              <div className="w-full lg:w-1/4">
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 sticky top-40">
                  <button
                    type="button"
                    onClick={() => showToast('New thread started in ' + activeCategory + '.', 'success')}
                    className="w-full bg-primary text-white px-4 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center mb-6"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Start a thread
                  </button>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-3">Categories</h3>
                  <div className="space-y-1">
                    {FORUM_CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => setActiveCategory(cat.name)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-left ${
                          activeCategory === cat.name
                            ? 'bg-primary-light text-primary-dark font-bold'
                            : 'text-text-primary hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3">{cat.icon}</span>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content - Thread List */}
              <div className="w-full lg:w-3/4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">{activeCategory} Discussions</h2>
                  <button
                    type="button"
                    onClick={() => showToast('Showing latest threads in ' + activeCategory, 'info')}
                    className="flex items-center text-sm font-bold text-text-secondary hover:text-primary border border-border px-3 py-1.5 rounded-lg bg-surface"
                  >
                    <Filter className="w-4 h-4 mr-2" /> Filter
                  </button>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                  {posts.map((thread) => (
                    <div key={thread.id} className="flex items-center p-5 border-b border-border last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-text-secondary font-bold mr-4 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {thread.authorInitials || thread.authorName[0]}
                      </div>
                      <div className="flex-grow min-w-0 pr-4">
                        <h3 className="font-bold text-text-primary text-lg truncate group-hover:text-primary transition-colors">{thread.content.substring(0, 50)}...</h3>
                        <div className="flex items-center text-xs text-text-secondary mt-1">
                          <span className="font-medium mr-3">{thread.authorName}</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(thread.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center shrink-0 w-16">
                        <span className="text-lg font-bold text-text-primary">{thread.likes}</span>
                        <span className="text-[10px] uppercase font-bold text-text-secondary">Likes</span>
                      </div>
                      <div className="hidden sm:flex ml-4 shrink-0 text-gray-300 group-hover:text-primary transition-colors">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <div className="p-10 text-center text-text-secondary">
                      No threads found. Be the first to start a discussion!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* CAMPS TAB */}
          {activeTab === 'Camps' && (
            <motion.div
              key="camps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-text-primary">Upcoming Donation Drives</h2>
                {userRole === 'bloodbank' && (
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Link
                      to="/register-bloodbank"
                      className="flex-1 sm:flex-none bg-primary text-white px-4 py-2.5 rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center"
                    >
                      <Tent className="w-4 h-4 mr-2" /> Organise a camp
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {camps.map((camp) => (
                  <div key={camp.id} className="bg-surface rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                    <div className="h-32 bg-primary-light flex items-center justify-center relative">
                      <Tent className="w-12 h-12 text-[#F5B7B1]" />
                      <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-xs font-bold text-primary shadow-sm">
                        {new Date(camp.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="font-bold text-lg text-text-primary mb-1">{camp.title}</h3>
                      <p className="text-sm text-text-secondary font-medium mb-4 flex items-center">
                        <Users className="w-4 h-4 mr-1" /> {camp.organizerName}
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-start text-sm text-text-secondary">
                          <Clock className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-primary" />
                          <span>{new Date(camp.date).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-start text-sm text-text-secondary">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-primary" />
                          <span>{camp.location}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-2">
                          <span>Spots Filled</span>
                          <span>{camp.rsvps} Attending</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${Math.min(100, (camp.rsvps / 50) * 100)}%` }}
                          ></div>
                        </div>
                        {rsvpCamps.has(camp.id) ? (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-grow flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold py-2.5 px-3 rounded-lg text-sm shadow-sm select-none">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>Joined</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRsvpCamps((prev) => {
                                  const next = new Set(prev);
                                  next.delete(camp.id);
                                  return next;
                                });
                                showToast(`Cancelled attendance for ${camp.title}.`, 'info');
                              }}
                              className="px-4 py-2.5 rounded-lg font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors text-sm shadow-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRsvpCamps((prev) => new Set(prev).add(camp.id));
                              showToast(`Joined the drive for ${camp.title}!`, 'success');
                            }}
                            className="w-full font-bold py-2.5 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            Join Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {camps.length === 0 && (
                  <div className="col-span-full p-10 text-center text-text-secondary bg-surface rounded-xl border border-dashed border-border">
                    No upcoming camps found. Check back later!
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Footer />

      {/* ── Share Your Story Modal ── */}
      <AnimatePresence>
        {isStoryModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="story-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !isSubmitting && setIsStoryModalOpen(false)}
            />

            {/* Modal Panel */}
            <motion.div
              key="story-modal"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="relative bg-gradient-to-br from-primary-light via-white to-white px-6 pt-6 pb-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                      <Feather className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary leading-tight">Share Your Story</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Your story will appear on the Gratitude Wall</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => !isSubmitting && setIsStoryModalOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-text-secondary"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleStorySubmit} className="p-6 space-y-4">
                  {/* Role badge */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className={`px-2.5 py-1 rounded-full ${userRole === 'bloodbank' ? 'bg-blue-100 text-blue-700' : 'bg-primary-light text-primary'}`}>
                      {userRole === 'bloodbank' ? '🏥 Blood Bank' : '🩸 Donor'}
                    </span>
                    <span className="text-text-secondary">Posting as your registered name</span>
                  </div>

                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      id="story-textarea"
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      placeholder="Share your donation experience, a thank you message, or an inspiring moment… (130–150 characters)"
                      maxLength={MAX_CHARS}
                      rows={5}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-gray-50 text-text-primary placeholder:text-text-secondary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all text-sm leading-relaxed disabled:opacity-60"
                    />
                    {/* Character counter */}
                    <div className={`absolute bottom-3 right-4 text-xs font-bold tabular-nums transition-colors ${
                      isTooLong ? 'text-red-500' : charsWarning ? 'text-amber-500' : 'text-text-secondary'
                    }`}>
                      {storyText.length}/{MAX_CHARS}
                    </div>
                  </div>

                  {/* Min-char hint */}
                  {isTooShort && storyText.length > 0 && (
                    <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {MIN_CHARS - storyText.trim().length} more characters needed (minimum {MIN_CHARS})
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isTooLong ? 'bg-red-400' : storyText.length >= MIN_CHARS ? 'bg-emerald-400' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, (storyText.length / MAX_CHARS) * 100)}%` }}
                    />
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    By posting, you agree that your story will be publicly visible on the Gratitude Wall under your registered name. Please keep it respectful and genuine.
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => !isSubmitting && setIsStoryModalOpen(false)}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-bold hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isTooShort || isTooLong}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-extrabold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-white/20" /> Post to Wall
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
