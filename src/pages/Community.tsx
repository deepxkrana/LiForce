import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Tent, MapPin, Clock, Users, Activity, CheckCircle, X, Feather, Share2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { useToast } from '../components/ToastProvider';

const FORUM_CATEGORIES = [
  { name: 'Donation Tips', icon: <Heart className="w-5 h-5 text-primary" />, active: true },
  { name: 'Health & Wellness', icon: <Activity className="w-5 h-5 text-accent" />, active: false },
  { name: 'Blood Bank News', icon: <Tent className="w-5 h-5 text-blue-500" />, active: false },
];

const MIN_CHARS = 130;
const MAX_CHARS = 150;

const Community: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getFormattedTab = (param: string | null) => {
    if (!param) return null;
    return param.charAt(0).toUpperCase() + param.slice(1).toLowerCase();
  };

  const [activeTab, setActiveTab] = useState<'Stories' | 'Forums' | 'Camps'>(() => {
    const formatted = getFormattedTab(tabParam);
    if (formatted === 'Stories' || formatted === 'Forums' || formatted === 'Camps') return formatted as any;
    return 'Stories';
  });

  useEffect(() => {
    const formatted = getFormattedTab(tabParam);
    if (formatted === 'Stories' || formatted === 'Forums' || formatted === 'Camps') {
      setActiveTab(formatted as any);
    }
  }, [tabParam]);

  const [activeCategory, setActiveCategory] = useState('Donation Tips');
  const [posts, setPosts] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [rsvpCamps, setRsvpCamps] = useState<Set<string>>(new Set());

  // Story Submission Modal state
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Camp RSVP Modal state
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null);
  const [donorLastDonatedAt, setDonorLastDonatedAt] = useState<string | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  const isDonorEligible = React.useMemo(() => {
    if (!donorLastDonatedAt) return true;
    const daysSince = (new Date().getTime() - new Date(donorLastDonatedAt).getTime()) / (1000 * 3600 * 24);
    return daysSince >= 56;
  }, [donorLastDonatedAt]);

  const userRole = localStorage.getItem('liforce_role');
  const isLoggedIn = !!localStorage.getItem('liforce_token');

  const currentUserId = (() => {
    const token = localStorage.getItem('liforce_token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]))?.id || null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const postsRes = await fetch(`${API_URL}/community/posts`);
        if (postsRes.ok) setPosts(await postsRes.json());

        const campsRes = await fetch(`${API_URL}/community/camps`);
        if (campsRes.ok) setCamps(await campsRes.json());

        if (isLoggedIn) {
          const rsvpsRes = await fetch(`${API_URL}/camps/my-rsvps`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('liforce_token')}` }
          });
          if (rsvpsRes.ok) {
            const data = await rsvpsRes.json();
            setRsvpCamps(new Set(data.rsvps));
          }
        }
      } catch (err) {
        console.error('Failed to fetch community data', err);
      }
    };
    fetchCommunityData();
  }, [isLoggedIn]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isStoryModalOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setStoryText('');
    }
  }, [isStoryModalOpen]);

  const handleJoinClick = async (campId: string) => {
    if (!isLoggedIn) {
      showToast('Please log in to join camps.', 'error');
      return;
    }
    setSelectedCampId(campId);
    if (userRole === 'donor') {
      setIsCheckingEligibility(true);
      try {
        const res = await fetch(`${API_URL}/donors/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('liforce_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDonorLastDonatedAt(data.lastDonatedAt);
        }
      } catch (e) {}
      setIsCheckingEligibility(false);
    }
  };

  const handleConfirmJoin = async (role: 'donor' | 'volunteer') => {
    if (!selectedCampId) return;
    const token = localStorage.getItem('liforce_token');
    try {
      const res = await fetch(`${API_URL}/camps/${selectedCampId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join camp');

      setRsvpCamps((prev) => new Set(prev).add(selectedCampId));
      setCamps(prev => prev.map(c => c.id === selectedCampId ? { ...c, rsvps: c.rsvps + 1 } : c));
      showToast('Successfully joined camp!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSelectedCampId(null);
    }
  };

  const handleCancelRsvp = async (campId: string) => {
    const token = localStorage.getItem('liforce_token');
    try {
      const res = await fetch(`${API_URL}/camps/${campId}/rsvp`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Failed to cancel');
      }
      setRsvpCamps((prev) => {
        const next = new Set(prev);
        next.delete(campId);
        return next;
      });
      setCamps(prev => prev.map(c => c.id === campId ? { ...c, rsvps: Math.max(0, c.rsvps - 1) } : c));
      showToast(`Cancelled attendance.`, 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

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
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-3">Knowledge Base</h3>
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

              {/* Right Content - Knowledge Base Content */}
              <div className="w-full lg:w-3/4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-text-primary">{activeCategory}</h2>
                </div>

                {activeCategory === 'Donation Tips' && (
                  <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-text-primary mb-3">Preparing for Your Donation</h3>
                      <p className="text-text-secondary leading-relaxed mb-4">A successful blood donation starts before you even arrive at the clinic. Follow these tips to ensure a smooth experience:</p>
                      <ul className="list-disc pl-5 text-text-secondary space-y-2">
                        <li>Drink plenty of water (at least 500ml) in the hours leading up to your appointment.</li>
                        <li>Eat a healthy, low-fat meal. Avoid fatty foods as they can affect the tests done on your blood.</li>
                        <li>Get a good night's sleep before your donation day.</li>
                        <li>Wear clothing with sleeves that can easily be rolled up above the elbow.</li>
                        <li>Bring a valid ID and a list of any medications you are currently taking.</li>
                      </ul>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-text-primary mb-3">Aftercare Tips</h3>
                      <p className="text-text-secondary leading-relaxed mb-4">Taking care of yourself after donating is just as important:</p>
                      <ul className="list-disc pl-5 text-text-secondary space-y-2">
                        <li>Rest for a few minutes and enjoy the complimentary snacks and drinks provided.</li>
                        <li>Keep the bandage on for the next several hours.</li>
                        <li>Avoid strenuous physical activity or heavy lifting for the rest of the day.</li>
                        <li>If you feel lightheaded, lie down with your feet elevated until the feeling passes.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeCategory === 'Health & Wellness' && (
                  <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-text-primary mb-3">The Importance of Iron</h3>
                      <p className="text-text-secondary leading-relaxed">Iron is an essential mineral that helps your body make red blood cells. Since donating blood removes some iron from your body, maintaining a healthy iron level is crucial for regular donors. Incorporate iron-rich foods like spinach, red meat, beans, and fortified cereals into your diet. Pairing these with vitamin C-rich foods can enhance iron absorption.</p>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-text-primary mb-3">Hydration is Key</h3>
                      <p className="text-text-secondary leading-relaxed">Your blood volume is primarily made up of water. Staying well-hydrated makes your veins more accessible and helps you recover faster post-donation. Aim to drink an extra 16 ounces of water before your appointment and continue hydrating throughout the day.</p>
                    </div>
                  </div>
                )}

                {activeCategory === 'Blood Bank News' && (
                  <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-text-primary mb-3">Current Blood Type Needs</h3>
                      <p className="text-text-secondary leading-relaxed">While all blood types are always needed, O-negative and O-positive are currently in high demand. O-negative is the universal donor type and is crucial in emergency situations when there's no time to determine a patient's blood type.</p>
                    </div>
                    <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-text-primary mb-3">Updated Safety Protocols</h3>
                      <p className="text-text-secondary leading-relaxed">Our partner blood banks have implemented enhanced safety protocols to protect both donors and staff. This includes frequent sanitization of donation stations, mandatory health screenings, and optimized appointment scheduling to minimize wait times and ensure social distancing.</p>
                    </div>
                  </div>
                )}
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
                      to="/organise-camp"
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
                          <span>{camp.rsvps} / {camp.capacity || 50} Attending</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (camp.rsvps / (camp.capacity || 50)) * 100)}%` }}
                          ></div>
                        </div>
                        {currentUserId === camp.organizerId ? (
                          <button
                            type="button"
                            onClick={() => {
                              const text = `Join my upcoming blood donation drive: "${camp.title}" at ${camp.location} on ${new Date(camp.date).toLocaleDateString()}! Let's save lives together on LiForce.`;
                              if (navigator.share) {
                                navigator.share({ title: camp.title, text }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(text);
                                showToast('Share text copied to clipboard!', 'success');
                              }
                            }}
                            className="w-full font-bold py-2.5 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                        ) : rsvpCamps.has(camp.id) ? (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-grow flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold py-2.5 px-3 rounded-lg text-sm shadow-sm select-none">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>Joined</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCancelRsvp(camp.id)}
                              className="px-4 py-2.5 rounded-lg font-bold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-colors text-sm shadow-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinClick(camp.id)}
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
      {/* ── Join Camp Modal ── */}
      <AnimatePresence>
        {selectedCampId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedCampId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden border border-border p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-extrabold text-text-primary">Join Camp</h2>
                  <button onClick={() => setSelectedCampId(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-secondary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {isCheckingEligibility ? (
                  <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary mb-2">How would you like to participate in this blood drive?</p>
                    
                    {userRole === 'donor' && (
                      <button
                        onClick={() => isDonorEligible && handleConfirmJoin('donor')}
                        disabled={!isDonorEligible}
                        className={`w-full py-3 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                          isDonorEligible 
                            ? 'border-primary text-primary hover:bg-primary hover:text-white' 
                            : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-70'
                        }`}
                      >
                        <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> Join as Donor</span>
                        {!isDonorEligible && <span className="text-[10px] font-normal px-4 text-center">Not eligible yet (56-day cooldown active)</span>}
                      </button>
                    )}

                    <button
                      onClick={() => handleConfirmJoin('volunteer')}
                      className="w-full py-3 rounded-xl border-2 border-accent text-accent font-bold hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" /> Join as Volunteer
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Community;
