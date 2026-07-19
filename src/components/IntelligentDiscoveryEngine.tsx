/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  Compass,
  MapPin,
  Map,
  Sparkles,
  Heart,
  TrendingUp,
  History,
  Bookmark,
  Bell,
  Star,
  ShieldCheck,
  Zap,
  BarChart3,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Briefcase,
  Store,
  FileText,
  Volume2,
  VolumeX,
  X,
  Share2,
  Plus,
  RefreshCw,
  Clock,
  Filter,
  Layers,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Store as StoreType, UnifiedListing, PioneerProfile, Job, Notification } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface IntelligentDiscoveryEngineProps {
  currentUser: User;
  onNavigate: (view: string, params?: any) => void;
}

// Internal Representation of a Discoverable Entity
interface DiscoverableEntity {
  id: string;
  type: 'product' | 'service' | 'business' | 'profile' | 'job' | 'ngo';
  title: string;
  subtitle: string;
  description: string;
  pricePi?: number;
  rating: number;
  reviewCount: number;
  trustScore: number;
  verified: boolean;
  responseTimeMinutes: number;
  createdAt: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
    geoHash: string;
  };
  tags: string[];
  imageUrl: string;
  // Stats
  views: number;
  clicks: number;
  ordersCount: number;
  completedJobsCount: number;
  conversionRate: number; // percentage
  completionRate: number; // percentage
  customerSatisfaction: number; // percentage
  ctr: number; // percentage
}

// Saved search interface
interface SavedSearch {
  id: string;
  query: string;
  category: string;
  radius: number;
  weights: string; // JSON string of ranking weights
  createdAt: string;
}

// Log view action
interface ViewLog {
  id: string;
  entityId: string;
  title: string;
  type: string;
  timestamp: string;
}

// Synonym mapping dictionary for intelligent expansion
const SYNONYMS: Record<string, string[]> = {
  'phone': ['iphone', 'smartphone', 'gadget', 'mobile', 'device', 'android'],
  'iphone': ['phone', 'smartphone', 'mobile', 'device'],
  'developer': ['engineer', 'coder', 'programmer', 'software', 'react', 'web'],
  'coder': ['developer', 'engineer', 'programmer', 'software', 'react', 'web'],
  'web': ['developer', 'engineer', 'coder', 'website', 'design', 'react'],
  'electrician': ['electrical', 'sparky', 'wire', 'wiring', 'repairs', 'home'],
  'coffee': ['cafe', 'barista', 'espresso', 'marco', 'beverage', 'drink'],
  'cafe': ['coffee', 'barista', 'espresso', 'beverage', 'restaurant'],
  'job': ['hiring', 'work', 'part-time', 'full-time', 'employment', 'gig'],
  'design': ['designer', 'ui', 'ux', 'graphic', 'logo', 'framer'],
  'tutor': ['teacher', 'math', 'education', 'learning', 'school', 'academic']
};

export default function IntelligentDiscoveryEngine({
  currentUser,
  onNavigate
}: IntelligentDiscoveryEngineProps) {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'services' | 'businesses' | 'profiles' | 'jobs'>('all');
  const [rankingWeights, setRankingWeights] = useState({
    relevance: 35,
    distance: 20,
    trust: 25,
    freshness: 10,
    popularity: 10
  });
  
  // Nearby discovery settings
  const [userRadiusKm, setUserRadiusKm] = useState(25);
  const [selectedCity, setSelectedCity] = useState<'All' | 'San Francisco' | 'New York' | 'London' | 'Singapore' | 'Hanoi'>('All');
  
  // Collections & engines
  const [favorites, setFavorites] = useState<string[]>([]);
  const [followedEntities, setFollowedEntities] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewLog[]>([]);
  
  // Voice search simulation
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  // UI control states
  const [selectedEntity, setSelectedEntity] = useState<DiscoverableEntity | null>(null);
  const [showRankingConfigurator, setShowRankingConfigurator] = useState(false);
  const [activeEngineView, setActiveEngineView] = useState<'feed' | 'map' | 'analytics' | 'security' | 'following'>('feed');
  const [searchExecutionTimeMs, setSearchExecutionTimeMs] = useState(12);
  const [cacheHit, setCacheHit] = useState(false);
  
  // Map coordinates & clustering mock
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(12);

  // Search analytics simulations
  const [analyticsLogs, setAnalyticsLogs] = useState<{
    searchQueries: { term: string; count: number; ctr: number; success: boolean }[];
    noResultsQueries: string[];
    recommendationClicks: number;
    recommendationConversions: number;
  }>({
    searchQueries: [
      { term: 'iphone 14 pro', count: 142, ctr: 18.4, success: true },
      { term: 'senior web dev', count: 98, ctr: 22.1, success: true },
      { term: 'local electrician', count: 76, ctr: 14.8, success: true },
      { term: 'gourmet arabica coffee', count: 54, ctr: 11.2, success: true },
      { term: 'logo graphic design', count: 48, ctr: 19.5, success: true }
    ],
    noResultsQueries: ['tesla pi phone lease', 'flying drone electrician', 'quantum computing tutor'],
    recommendationClicks: 345,
    recommendationConversions: 82
  });

  // Security abuse simulation variables
  const [botDetectionStats, setBotDetectionStats] = useState({
    blockedRequests: 1432,
    spamListingsFlagged: 24,
    fakeTrendingAttemptsBlocked: 87,
    trustVerificationAudits: 140
  });

  // --- COMPONENT LOAD & DB FETCH ---
  const allEntities = useMemo<DiscoverableEntity[]>(() => {
    // 1. Gather all actual entities from local storage database
    const products = PiBusinessMarketDB.getProducts();
    const unifiedListings = PiBusinessMarketDB.getUnifiedListings();
    const stores = PiBusinessMarketDB.getStores();
    const profiles = PiBusinessMarketDB.getPioneerProfiles();
    const jobs = PiBusinessMarketDB.getJobs();

    const list: DiscoverableEntity[] = [];

    // Map retail products
    products.forEach((p) => {
      // Find associated store location or use defaults
      const store = stores.find(s => s.id === p.storeId);
      const lat = store?.slug.includes('cafe') ? 37.7699 : 37.7749 + (Math.random() - 0.5) * 0.15;
      const lng = store?.slug.includes('cafe') ? -122.4468 : -122.4194 + (Math.random() - 0.5) * 0.15;
      
      list.push({
        id: p.id,
        type: 'product',
        title: p.title,
        subtitle: store?.name || 'Retail Store',
        description: p.description,
        pricePi: p.pricePi,
        rating: p.averageRating || 4.8,
        reviewCount: p.reviewCount || 0,
        trustScore: store?.verified ? 92 : 78,
        verified: store?.verified || false,
        responseTimeMinutes: 12 + Math.floor(Math.random() * 20),
        createdAt: p.createdAt,
        location: {
          lat,
          lng,
          city: store?.category.includes('Cafe') ? 'San Francisco' : 'San Francisco',
          country: 'United States',
          geoHash: PiBusinessMarketDB.encodeGeohash(lat, lng)
        },
        tags: [p.category, ...(p.tags || []), 'retail', 'product'],
        imageUrl: p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
        views: p.views || 45,
        clicks: Math.floor((p.views || 45) * 0.2),
        ordersCount: p.salesCount || 0,
        completedJobsCount: 0,
        conversionRate: Math.floor(10 + Math.random() * 15),
        completionRate: 100,
        customerSatisfaction: Math.floor(92 + Math.random() * 8),
        ctr: parseFloat((12 + Math.random() * 8).toFixed(1))
      });
    });

    // Map unified listings (Phase 5 structures)
    unifiedListings.forEach((ul) => {
      // Skip if already soft-deleted or hidden
      if (ul.status !== 'published') return;
      
      // Determine mapped type
      let mappedType: DiscoverableEntity['type'] = 'service';
      if (ul.type === 'physical' || ul.type === 'digital') mappedType = 'product';
      if (ul.type === 'job') mappedType = 'job';

      list.push({
        id: ul.id,
        type: mappedType,
        title: ul.title,
        subtitle: ul.ownerName || 'Verified Pioneer',
        description: ul.description,
        pricePi: ul.pricePi,
        rating: ul.rating || 4.9,
        reviewCount: ul.reviewCount || 1,
        trustScore: 88,
        verified: true,
        responseTimeMinutes: 8 + Math.floor(Math.random() * 15),
        createdAt: ul.createdAt,
        location: {
          lat: ul.location?.lat || 37.7749,
          lng: ul.location?.lng || -122.4194,
          city: ul.location?.city || 'San Francisco',
          country: ul.location?.country || 'United States',
          geoHash: ul.location?.geoHash || '9q8yy'
        },
        tags: [...(ul.tags || []), ul.type, 'unified'],
        imageUrl: ul.imageUrls?.[0] || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60',
        views: 120,
        clicks: 34,
        ordersCount: 4,
        completedJobsCount: ul.type === 'job' ? 1 : 0,
        conversionRate: 18,
        completionRate: 95,
        customerSatisfaction: 97,
        ctr: 14.2
      });
    });

    // Map stores / businesses
    stores.forEach((s) => {
      const lat = 37.7749 + (Math.random() - 0.5) * 0.12;
      const lng = -122.4194 + (Math.random() - 0.5) * 0.12;

      list.push({
        id: s.id,
        type: 'business',
        title: s.name,
        subtitle: s.category || 'Local Business',
        description: s.description,
        rating: s.rating || 5.0,
        reviewCount: s.reviewCount || 0,
        trustScore: s.verified ? 95 : 80,
        verified: s.verified,
        responseTimeMinutes: 5,
        createdAt: s.createdAt,
        location: {
          lat,
          lng,
          city: 'San Francisco',
          country: 'United States',
          geoHash: PiBusinessMarketDB.encodeGeohash(lat, lng)
        },
        tags: [s.category, 'store', 'merchant', 'business'],
        imageUrl: s.logoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=60',
        views: s.analytics?.views || 300,
        clicks: Math.floor((s.analytics?.views || 300) * 0.25),
        ordersCount: s.analytics?.ordersCount || 0,
        completedJobsCount: 0,
        conversionRate: s.analytics?.conversionRate || 12,
        completionRate: 100,
        customerSatisfaction: Math.floor(95 + Math.random() * 5),
        ctr: 18.2
      });
    });

    // Map professional profiles
    profiles.forEach((p) => {
      if (p.softDeleted) return;
      const lat = p.location?.lat || 37.7749 + (Math.random() - 0.5) * 0.14;
      const lng = p.location?.lng || -122.4194 + (Math.random() - 0.5) * 0.14;

      list.push({
        id: p.id,
        type: 'profile',
        title: p.name,
        subtitle: p.category || 'Pioneer Professional',
        description: p.description,
        rating: p.rating || 4.7,
        reviewCount: p.reviewCount || 0,
        trustScore: p.piPaymentSupported ? 90 : 75,
        verified: p.piPaymentSupported,
        responseTimeMinutes: 15,
        createdAt: p.createdAt,
        location: {
          lat,
          lng,
          city: p.location?.city || 'San Francisco',
          country: p.location?.country || 'United States',
          geoHash: p.location?.geoHash || PiBusinessMarketDB.encodeGeohash(lat, lng)
        },
        tags: [...(p.skills || []), p.category, p.serviceArea, 'professional', 'worker'],
        imageUrl: p.photoUrls?.[0] || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60',
        views: 82,
        clicks: 19,
        ordersCount: 0,
        completedJobsCount: 5,
        conversionRate: 22,
        completionRate: 98,
        customerSatisfaction: 99,
        ctr: 15.6
      });
    });

    // Map jobs board individual items
    jobs.forEach((j) => {
      const lat = 37.7749 + (Math.random() - 0.5) * 0.1;
      const lng = -122.4194 + (Math.random() - 0.5) * 0.1;

      list.push({
        id: j.id,
        type: 'job',
        title: j.title,
        subtitle: j.providerName || 'Hiring Pioneer',
        description: j.description,
        pricePi: j.salaryPi,
        rating: 4.8,
        reviewCount: 2,
        trustScore: 85,
        verified: true,
        responseTimeMinutes: 45,
        createdAt: j.createdAt,
        location: {
          lat,
          lng,
          city: j.location || 'San Francisco',
          country: 'United States',
          geoHash: PiBusinessMarketDB.encodeGeohash(lat, lng)
        },
        tags: [j.category, j.salaryType, j.locationType, 'job', 'hiring', 'employment'],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60',
        views: 240,
        clicks: 84,
        ordersCount: 0,
        completedJobsCount: j.applicantCount || 0,
        conversionRate: 35,
        completionRate: 92,
        customerSatisfaction: 94,
        ctr: 24.5
      });
    });

    // Seed empty list backups with custom beautiful elements so search is incredibly robust
    if (list.length === 0) {
      // Seed fallback mock items
      list.push({
        id: 'seed_prod_1',
        type: 'product',
        title: 'PiBook Elite Ultra Laptop',
        subtitle: 'Apex Web3 Electronics',
        description: 'Developer edition high performance workstation. Complete Web3 pre-configured tools. 32GB RAM, 1TB SSD.',
        pricePi: 349.00,
        rating: 4.9,
        reviewCount: 18,
        trustScore: 98,
        verified: true,
        responseTimeMinutes: 4,
        createdAt: new Date().toISOString(),
        location: { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'United States', geoHash: '9q8yy' },
        tags: ['electronics', 'laptop', 'computer', 'developer', 'hardware'],
        imageUrl: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=500&auto=format&fit=crop&q=60',
        views: 890, clicks: 140, ordersCount: 12, completedJobsCount: 0, conversionRate: 8.5, completionRate: 100, customerSatisfaction: 98, ctr: 15.7
      });
      list.push({
        id: 'seed_srv_1',
        type: 'service',
        title: 'Certified Node & Pipe Repair',
        subtitle: 'John & Co Plumbing Group',
        description: 'Emergency domestic system services, kitchen blockages, heating system leak repair. Low rates paid in Pi coins.',
        pricePi: 15.00,
        rating: 4.7,
        reviewCount: 34,
        trustScore: 91,
        verified: true,
        responseTimeMinutes: 12,
        createdAt: new Date().toISOString(),
        location: { lat: 37.7599, lng: -122.4368, city: 'San Francisco', country: 'United States', geoHash: '9q8y8' },
        tags: ['plumbing', 'home repair', 'emergency', 'maintenance'],
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60',
        views: 420, clicks: 76, ordersCount: 18, completedJobsCount: 0, conversionRate: 23.6, completionRate: 98, customerSatisfaction: 94, ctr: 18.1
      });
      list.push({
        id: 'seed_job_1',
        type: 'job',
        title: 'React Native Pi Wallet Integration Specialist',
        subtitle: 'Pioneer FinTech Labs',
        description: 'We need an experienced developer to connect the official Pi SDK to our custom retail application.',
        pricePi: 1500.00,
        rating: 5.0,
        reviewCount: 1,
        trustScore: 89,
        verified: true,
        responseTimeMinutes: 20,
        createdAt: new Date().toISOString(),
        location: { lat: 37.7858, lng: -122.4008, city: 'San Francisco', country: 'United States', geoHash: '9q8yu' },
        tags: ['developer', 'react native', 'pi sdk', 'wallet', 'crypto', 'blockchain'],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60',
        views: 1230, clicks: 420, ordersCount: 0, completedJobsCount: 4, conversionRate: 34.1, completionRate: 90, customerSatisfaction: 95, ctr: 34.1
      });
    }

    return list;
  }, []);

  // --- INITIALIZE PERSISTED STATES ---
  useEffect(() => {
    // Load favorites
    const savedFavs = localStorage.getItem('pi_biz_mkt_fav_entities');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    // Load followed
    const savedFollow = localStorage.getItem('pi_biz_mkt_followed_entities');
    if (savedFollow) setFollowedEntities(JSON.parse(savedFollow));

    // Load searches history
    const savedRecents = localStorage.getItem('pi_biz_mkt_recent_searches');
    if (savedRecents) setRecentSearches(JSON.parse(savedRecents));

    // Load saved queries
    const savedQueries = localStorage.getItem('pi_biz_mkt_saved_searches');
    if (savedQueries) setSavedSearches(JSON.parse(savedQueries));

    // Load viewed history
    const savedViews = localStorage.getItem('pi_biz_mkt_view_history');
    if (savedViews) setViewHistory(JSON.parse(savedViews));
  }, []);

  // --- INTERACTIVE SAVE HELPERS ---
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(fav => fav !== id);
    } else {
      updated = [...favorites, id];
      // Sync visual notification
      const entity = allEntities.find(ent => ent.id === id);
      if (entity) {
        PiBusinessMarketDB.createNotification(
          currentUser.uid,
          'Saved to Favorites ❤️',
          `"${entity.title}" has been successfully added to your private discovery collection.`,
          'ads_milestone'
        );
      }
    }
    setFavorites(updated);
    localStorage.setItem('pi_biz_mkt_fav_entities', JSON.stringify(updated));
  };

  const handleToggleFollow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let updated;
    const entity = allEntities.find(ent => ent.id === id);
    
    if (followedEntities.includes(id)) {
      updated = followedEntities.filter(f => f !== id);
    } else {
      updated = [...followedEntities, id];
      
      if (entity) {
        PiBusinessMarketDB.createNotification(
          currentUser.uid,
          `New Follow Active! 🔔`,
          `You are now following updates from "${entity.title}". You will receive notifications when they post new listings.`,
          'system_announcement'
        );
      }
    }
    setFollowedEntities(updated);
    localStorage.setItem('pi_biz_mkt_followed_entities', JSON.stringify(updated));
  };

  const handleSaveSearch = () => {
    if (!searchQuery.trim()) return;
    const newSave: SavedSearch = {
      id: `saved_q_${Date.now()}`,
      query: searchQuery,
      category: activeTab,
      radius: userRadiusKm,
      weights: JSON.stringify(rankingWeights),
      createdAt: new Date().toISOString()
    };
    const updated = [newSave, ...savedSearches];
    setSavedSearches(updated);
    localStorage.setItem('pi_biz_mkt_saved_searches', JSON.stringify(updated));

    PiBusinessMarketDB.createNotification(
      currentUser.uid,
      'Search Query Saved! 💾',
      `Auto-tracking is now active for query: "${searchQuery}". You will receive alerts on matches.`,
      'system_announcement'
    );
  };

  const handleDeleteSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('pi_biz_mkt_saved_searches', JSON.stringify(updated));
  };

  const handleLogView = (entity: DiscoverableEntity) => {
    const log: ViewLog = {
      id: `log_${Date.now()}`,
      entityId: entity.id,
      title: entity.title,
      type: entity.type,
      timestamp: new Date().toISOString()
    };
    const updated = [log, ...viewHistory.filter(h => h.entityId !== entity.id).slice(0, 19)];
    setViewHistory(updated);
    localStorage.setItem('pi_biz_mkt_view_history', JSON.stringify(updated));
    setSelectedEntity(entity);

    // Dynamic CTR track metrics simulation
    setAnalyticsLogs(prev => ({
      ...prev,
      recommendationClicks: prev.recommendationClicks + 1
    }));
  };

  // --- UNIVERSAL SEARCH ENGINE ARCHITECTURE ---
  const searchEngineResults = useMemo(() => {
    const start = performance.now();
    
    // Normalize user search queries
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/).filter(Boolean);

    // Auto synonym expansion mapping
    let queryExpansionWords = [...words];
    words.forEach(word => {
      if (SYNONYMS[word]) {
        queryExpansionWords = [...queryExpansionWords, ...SYNONYMS[word]];
      }
    });

    let filtered = allEntities;

    // Filter by Tab/Category
    if (activeTab !== 'all') {
      filtered = filtered.filter(entity => {
        if (activeTab === 'products') return entity.type === 'product';
        if (activeTab === 'services') return entity.type === 'service';
        if (activeTab === 'businesses') return entity.type === 'business';
        if (activeTab === 'profiles') return entity.type === 'profile';
        if (activeTab === 'jobs') return entity.type === 'job';
        return true;
      });
    }

    // Filter by location city selection
    if (selectedCity !== 'All') {
      filtered = filtered.filter(ent => ent.location.city.toLowerCase() === selectedCity.toLowerCase());
    }

    // Filter by distance/radius from map center
    filtered = filtered.filter(ent => {
      const distance = PiBusinessMarketDB.calculateDistanceKm(
        mapCenter.lat, mapCenter.lng,
        ent.location.lat, ent.location.lng
      );
      return distance <= userRadiusKm;
    });

    // Score and rank all discoverable listings based on weights
    const scoredListings = filtered.map(entity => {
      let relevanceScore = 0;

      if (queryExpansionWords.length > 0) {
        // String similarity scan (Title, description, tags, subtitle)
        const t = entity.title.toLowerCase();
        const d = entity.description.toLowerCase();
        const s = entity.subtitle.toLowerCase();
        const tg = entity.tags.map(x => x.toLowerCase());

        queryExpansionWords.forEach((word) => {
          // Exact matches have maximum value
          if (t === word) relevanceScore += 100;
          else if (t.includes(word)) relevanceScore += 45;
          
          if (d.includes(word)) relevanceScore += 15;
          if (s.includes(word)) relevanceScore += 20;
          
          if (tg.includes(word)) relevanceScore += 30;
          else if (tg.some(tag => tag.includes(word))) relevanceScore += 10;
        });
      } else {
        // If query is empty, default relevance is normalized
        relevanceScore = 50;
      }

      // 1. Relevance normalized (0 to 100)
      const finalRelevance = Math.min(100, relevanceScore);

      // 2. Distance score (Closer is higher, 0 to 100)
      const distanceKm = PiBusinessMarketDB.calculateDistanceKm(
        mapCenter.lat, mapCenter.lng,
        entity.location.lat, entity.location.lng
      );
      const finalDistanceScore = Math.max(0, 100 - (distanceKm * 2)); // 50km max range

      // 3. Trust Score (0 to 100)
      const finalTrustScore = entity.trustScore;

      // 4. Freshness score (newer listings get higher priority)
      const daysOld = (Date.now() - new Date(entity.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const finalFreshnessScore = Math.max(0, 100 - (daysOld * 3)); // degrades over 30 days

      // 5. Popularity score (Views, Clicks, Ratings, 0 to 100)
      const rawPopularity = (entity.views * 0.1) + (entity.clicks * 0.3) + (entity.rating * 10);
      const finalPopularityScore = Math.min(100, Math.max(0, rawPopularity));

      // Calculate configurable weight sum
      const totalWeight = (
        rankingWeights.relevance +
        rankingWeights.distance +
        rankingWeights.trust +
        rankingWeights.freshness +
        rankingWeights.popularity
      ) || 1;

      const finalRankScore = (
        (finalRelevance * rankingWeights.relevance) +
        (finalDistanceScore * rankingWeights.distance) +
        (finalTrustScore * rankingWeights.trust) +
        (finalFreshnessScore * rankingWeights.freshness) +
        (finalPopularityScore * rankingWeights.popularity)
      ) / totalWeight;

      return {
        entity,
        scores: {
          relevance: finalRelevance,
          distance: finalDistanceScore,
          trust: finalTrustScore,
          freshness: finalFreshnessScore,
          popularity: finalPopularityScore,
          total: parseFloat(finalRankScore.toFixed(2))
        },
        distanceKm: parseFloat(distanceKm.toFixed(1))
      };
    });

    // Sort descending by rank score
    scoredListings.sort((a, b) => b.scores.total - a.scores.total);

    const end = performance.now();
    // Cache simulation & execute calculation
    const delay = Math.round(end - start) || 2;
    setTimeout(() => {
      setSearchExecutionTimeMs(delay < 1 ? 2 : delay);
      setCacheHit(normalizedQuery.length > 0 && Math.random() > 0.7);
    }, 50);

    return scoredListings;
  }, [searchQuery, activeTab, selectedCity, mapCenter, userRadiusKm, rankingWeights, allEntities]);

  // Handle query clicks / enter triggers for search history logging
  const handleTriggerSearchSubmit = (text: string) => {
    if (!text.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== text.toLowerCase());
      const updated = [text, ...filtered].slice(0, 9);
      localStorage.setItem('pi_biz_mkt_recent_searches', JSON.stringify(updated));
      return updated;
    });

    // Seed log metrics
    setAnalyticsLogs(prev => {
      const existing = prev.searchQueries.find(q => q.term.toLowerCase() === text.toLowerCase());
      if (existing) {
        return {
          ...prev,
          searchQueries: prev.searchQueries.map(q => 
            q.term.toLowerCase() === text.toLowerCase() ? { ...q, count: q.count + 1 } : q
          )
        };
      } else {
        return {
          ...prev,
          searchQueries: [...prev.searchQueries, { term: text, count: 1, ctr: 12.5, success: true }].slice(0, 10)
        };
      }
    });
  };

  const clearSearchHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('pi_biz_mkt_recent_searches');
  };

  // --- SIMULATED VOICE RECOGNITION ENGINE ---
  const handleToggleVoiceSearch = () => {
    if (isVoiceSearchActive) {
      setIsVoiceSearchActive(false);
      return;
    }
    
    setIsVoiceSearchActive(true);
    setVoiceTranscript("Listening...");

    const phrases = [
      "Find local developer profiles",
      "Iphone 14 pro near me",
      "Urgent emergency electrician services",
      "Highest rated coffee shops in city"
    ];
    
    const chosen = phrases[Math.floor(Math.random() * phrases.length)];

    setTimeout(() => {
      setVoiceTranscript(`" ${chosen} "`);
    }, 1200);

    setTimeout(() => {
      setSearchQuery(chosen);
      setIsVoiceSearchActive(false);
      handleTriggerSearchSubmit(chosen);
    }, 2400);
  };

  // --- FOLLOWING FEED ENGINE ---
  const followingFeedUpdates = useMemo(() => {
    const list = allEntities.filter(ent => followedEntities.includes(ent.id));
    return list.map(ent => ({
      id: `post_${ent.id}_${Date.now()}`,
      entity: ent,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      content: `Pioneers! We just updated our inventory and tags on the Pi Business Market. Contact us or visit our storefront. We proudly accept 100% payments in Pi consensus coin! 🪙`
    }));
  }, [followedEntities, allEntities]);

  return (
    <div className="flex flex-col gap-6" id="intelligent_discovery_engine_root">
      
      {/* ENTERPRISE DISCOVERY ENGINE HEADER */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-3 flex gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono border border-indigo-500/20 font-bold">
            <Zap className="w-3 h-3 animate-pulse text-amber-400" />
            V1.0 Live
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 font-bold">
            <Activity className="w-3 h-3" />
            99.9% Latency
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center border border-violet-400/20">
                <Compass className="w-4.5 h-4.5 text-white animate-spin-slow" />
              </div>
              <span className="text-xs font-bold text-violet-400 tracking-widest uppercase font-mono">Discovery Core Engine</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">
              Phase 6 Enterprise Discovery Ecosystem
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
              Connect with physical stores, professional services, local businesses, jobs, and digital products via a highly customizable, real-time ranking engine.
            </p>
          </div>

          {/* VIEW SWITCHER SUB-NAV */}
          <div className="bg-slate-950 border border-slate-800/80 p-1 rounded-xl flex gap-1 self-start md:self-center shadow-lg">
            <button
              onClick={() => setActiveEngineView('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeEngineView === 'feed'
                  ? 'bg-violet-600 text-slate-100 shadow-md shadow-violet-500/10'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Personalized Feed</span>
            </button>
            <button
              onClick={() => setActiveEngineView('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeEngineView === 'map'
                  ? 'bg-violet-600 text-slate-100 shadow-md shadow-violet-500/10'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Geo Grid</span>
            </button>
            <button
              onClick={() => setActiveEngineView('following')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
                activeEngineView === 'following'
                  ? 'bg-violet-600 text-slate-100 shadow-md shadow-violet-500/10'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Following</span>
              {followedEntities.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveEngineView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeEngineView === 'analytics'
                  ? 'bg-violet-600 text-slate-100 shadow-md shadow-violet-500/10'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveEngineView('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeEngineView === 'security'
                  ? 'bg-violet-600 text-slate-100 shadow-md shadow-violet-500/10'
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE SEARCH HUB BAR */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap md:flex-nowrap items-center gap-2.5 shadow-xl relative z-30">
          
          {/* SEARCH INPUT */}
          <div className="flex-1 min-w-[280px] relative flex items-center">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTriggerSearchSubmit(searchQuery)}
              placeholder="Search products, services, stores, jobs, skills, cities, tags..."
              className="w-full bg-slate-950/65 text-sm text-slate-100 pl-11 pr-20 py-3.5 rounded-xl border border-slate-800/80 focus:border-violet-500 focus:outline-none transition-all placeholder:text-slate-500 font-medium"
            />
            
            {/* VOICE SEARCH SIM BUTTON */}
            <div className="absolute right-3 flex items-center gap-2">
              <button
                onClick={handleToggleVoiceSearch}
                className={`p-1.5 rounded-lg transition-all border ${
                  isVoiceSearchActive 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                    : 'bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Voice Search (Simulated)"
              >
                {isVoiceSearchActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg hover:bg-slate-850 text-slate-500 hover:text-slate-350"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* RADIUS EXPANSION */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl min-w-[170px]">
            <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>Radius Limit</span>
                <span className="text-violet-400">{userRadiusKm} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={userRadiusKm}
                onChange={(e) => setUserRadiusKm(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600 mt-1"
              />
            </div>
          </div>

          {/* CITY DROP FILTER */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e: any) => setSelectedCity(e.target.value)}
              className="bg-slate-950 border border-slate-850 hover:border-slate-750 text-xs font-bold text-slate-300 py-3.5 px-4.5 rounded-xl cursor-pointer focus:outline-none transition-all"
            >
              <option value="All">🌐 All Cities</option>
              <option value="San Francisco">📍 San Francisco</option>
              <option value="New York">📍 New York</option>
              <option value="London">📍 London</option>
              <option value="Singapore">📍 Singapore</option>
              <option value="Hanoi">📍 Hanoi</option>
            </select>
          </div>

          {/* TUNER DROPDOWN TRIGGER */}
          <button
            onClick={() => setShowRankingConfigurator(!showRankingConfigurator)}
            className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              showRankingConfigurator || Object.values(rankingWeights).some(w => w !== 20)
                ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Rank Tuning</span>
          </button>

          {/* SAVE SEARCH PRESET BUTTON */}
          {searchQuery && (
            <button
              onClick={handleSaveSearch}
              className="p-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Save search parameters"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden md:inline text-xs">Save query</span>
            </button>
          )}
        </div>

        {/* INTERACTIVE VOICE TRANSCRIPT POP OVER */}
        <AnimatePresence>
          {isVoiceSearchActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 text-rose-300"
            >
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping shrink-0" />
              <span className="text-xs font-mono font-semibold">Discovery Voice Recognition:</span>
              <span className="text-xs italic font-sans">{voiceTranscript}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ALGORITHM RANK TUNING OVERLAY DRAWER */}
        <AnimatePresence>
          {showRankingConfigurator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4.5 h-4.5 text-violet-400" />
                    <h3 className="text-sm font-bold text-slate-200">Neural Ranking Factors Weight Tuner</h3>
                  </div>
                  <button
                    onClick={() => setRankingWeights({ relevance: 20, distance: 20, trust: 20, freshness: 20, popularity: 20 })}
                    className="text-[10px] text-slate-400 hover:text-slate-200 font-mono font-bold uppercase underline"
                  >
                    Reset Equal (20% each)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {/* RELEVANCE WEIGHT */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-blue-400" /> Relevance</span>
                      <span className="text-blue-400 font-mono">{rankingWeights.relevance}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={rankingWeights.relevance}
                      onChange={(e) => setRankingWeights(prev => ({ ...prev, relevance: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-[9px] text-slate-500 leading-tight">Word semantic matching, tags matches & synonyms overlap.</p>
                  </div>

                  {/* DISTANCE WEIGHT */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Distance</span>
                      <span className="text-emerald-400 font-mono">{rankingWeights.distance}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={rankingWeights.distance}
                      onChange={(e) => setRankingWeights(prev => ({ ...prev, distance: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[9px] text-slate-500 leading-tight">Proximity from search node. Prioritizes local Pioneers.</p>
                  </div>

                  {/* TRUST WEIGHT */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Trust / Ratings</span>
                      <span className="text-amber-400 font-mono">{rankingWeights.trust}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={rankingWeights.trust}
                      onChange={(e) => setRankingWeights(prev => ({ ...prev, trust: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                    <p className="text-[9px] text-slate-500 leading-tight">Pioneer verification level, rating metrics, dispute count.</p>
                  </div>

                  {/* FRESHNESS */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400" /> Freshness</span>
                      <span className="text-purple-400 font-mono">{rankingWeights.freshness}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={rankingWeights.freshness}
                      onChange={(e) => setRankingWeights(prev => ({ ...prev, freshness: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-500"
                    />
                    <p className="text-[9px] text-slate-500 leading-tight">Time delta since catalog entry or profile modification.</p>
                  </div>

                  {/* POPULARITY */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850/80 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-rose-400" /> Popularity</span>
                      <span className="text-rose-400 font-mono">{rankingWeights.popularity}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={rankingWeights.popularity}
                      onChange={(e) => setRankingWeights(prev => ({ ...prev, popularity: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-500"
                    />
                    <p className="text-[9px] text-slate-500 leading-tight">Accumulated views, active conversions, repeat order rate.</p>
                  </div>
                </div>

                {/* VISUAL SHARING WARNING */}
                <div className="flex items-center gap-2.5 bg-violet-950/10 border border-violet-800/10 p-3 rounded-xl">
                  <Terminal className="w-4 h-4 text-violet-400 shrink-0" />
                  <p className="text-[10px] text-violet-300 font-mono leading-tight">
                    Algorithm scoring is executed dynamic client-side (Latency target &lt;100ms) with instant index update on any parameter shift.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEED TYPE HORIZONTAL SUB-FILTER */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-900 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            All Entities ({allEntities.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'products'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Store className="w-3 h-3 text-blue-450" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'services'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3 text-emerald-400" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'businesses'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Store className="w-3 h-3 text-amber-400" />
            Stores
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'profiles'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3 text-purple-400" />
            Professionals
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'jobs'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3 h-3 text-rose-400" />
            Jobs Board
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE MODE */}
      {activeEngineView === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in" id="feed_grid_layout">
          
          {/* SEARCH SIDE PANEL: RECENT HISTORY, SAVED SEARCHES, STATS */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* SEARCH STATS BOARD */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-400" /> Execution Diagnostics
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 font-medium">Engine Latency</p>
                  <p className="text-base font-mono font-bold text-emerald-400 mt-1">{searchExecutionTimeMs} ms</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 font-medium">Cache Status</p>
                  <p className="text-base font-mono font-bold text-violet-400 mt-1">
                    {cacheHit ? "HIT (Local)" : "MISS (Fresh)"}
                  </p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 font-medium">Scannable Nodes</p>
                  <p className="text-base font-mono font-bold text-slate-300 mt-1">{allEntities.length}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                  <p className="text-[10px] text-slate-500 font-medium">Results Found</p>
                  <p className="text-base font-mono font-bold text-amber-400 mt-1">{searchEngineResults.length}</p>
                </div>
              </div>
            </div>

            {/* RECENT SEARCHES */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" /> Recent Queries
                </span>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearSearchHistory}
                    className="text-[9px] text-slate-500 hover:text-slate-350 underline font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="text-xs text-slate-555 italic">No search history recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(term)}
                      className="px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-850 rounded-lg text-slate-350 hover:text-slate-100 hover:border-slate-700 transition-all font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SAVED SEARCH PARAMS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-slate-400" /> Saved Alert Subscriptions
              </span>

              {savedSearches.length === 0 ? (
                <p className="text-xs text-slate-555 italic leading-relaxed">
                  No saved searches yet. Save any query to automatically receive background transactional notifications on new listings.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedSearches.map((save) => (
                    <div
                      key={save.id}
                      onClick={() => {
                        setSearchQuery(save.query);
                        setActiveTab(save.category as any);
                        setUserRadiusKm(save.radius);
                        setRankingWeights(JSON.parse(save.weights));
                      }}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-750 p-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-200 truncate">{save.query}</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-550 font-mono">
                          <span>Radius: {save.radius}km</span>
                          <span>•</span>
                          <span className="capitalize">{save.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSavedSearch(save.id, e)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-450 hover:text-slate-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECENT VIEWED ITEMS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Viewed History
              </span>

              {viewHistory.length === 0 ? (
                <p className="text-xs text-slate-555 italic">Your viewed catalog items will appear here.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {viewHistory.slice(0, 5).map((log) => {
                    const entity = allEntities.find(ent => ent.id === log.entityId);
                    return (
                      <div
                        key={log.id}
                        onClick={() => entity && handleLogView(entity)}
                        className="bg-slate-950 border border-slate-850 hover:border-slate-750 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <img
                          src={entity?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                          alt={log.title}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 truncate">{log.title}</span>
                          <span className="text-[9px] text-slate-500 font-mono capitalize">{log.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* MAIN COLUMN RESULTS AND RECOMMENDATIONS FEED */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* RESULTS COUNTER BAR */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  Showing <span className="font-bold text-slate-200">{searchEngineResults.length}</span> discoverable nodes matching your radius and filters
                </p>
              </div>

              {/* SAVED SEARCH TRIGGER */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">Rank Algorithm: Active Neural Custom</span>
              </div>
            </div>

            {/* RESULTS LIST & GRAPH COMPOSITIONS */}
            {searchEngineResults.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
                <Search className="w-12 h-12 text-slate-600 animate-pulse" />
                <div>
                  <h4 className="text-base font-bold text-slate-350">No Search Match Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No active listings or profiles matching "{searchQuery}" are located within your {userRadiusKm}km radius scope. Try expanding your radius.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('all');
                      setUserRadiusKm(50);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => setUserRadiusKm(100)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Extend Radius to 100km
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4" id="discovery_listings_feed">
                {searchEngineResults.map(({ entity, scores, distanceKm }) => (
                  <div
                    key={entity.id}
                    onClick={() => handleLogView(entity)}
                    className="group bg-slate-900 border border-slate-800/80 hover:border-slate-700/85 p-4 rounded-2xl flex flex-col sm:flex-row gap-4.5 cursor-pointer transition-all relative overflow-hidden shadow-md"
                  >
                    {/* ACCENT AMBER BORDER FOR HIGH RATINGS */}
                    {entity.rating >= 4.9 && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    )}

                    {/* PHOTO PREVIEW */}
                    <div className="w-full sm:w-32 h-32 bg-slate-950 rounded-xl overflow-hidden shrink-0 relative">
                      <img
                        src={entity.imageUrl}
                        alt={entity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800 rounded-lg py-1 px-2 flex items-center gap-1 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-amber-400">★</span>
                        <span className="text-[10px] font-mono font-bold text-slate-250">{entity.rating}</span>
                      </div>
                      
                      {/* TYPE ENTITY CHIP */}
                      <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wide bg-slate-950/90 border border-slate-850 px-2 py-0.5 rounded text-violet-400 backdrop-blur-sm">
                        {entity.type}
                      </span>
                    </div>

                    {/* MIDDLE COLUMN: TITLE, DESC, ADDR */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0 justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-sans font-bold text-sm text-slate-150 tracking-tight truncate group-hover:text-violet-400 transition-colors">
                            {entity.title}
                          </h3>
                          {entity.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-amber-500" title="Pi Verified Elite" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{entity.subtitle}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{entity.description}</p>
                      </div>

                      {/* TAGS FOOTER */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entity.tags.slice(0, 4).map((tag, i) => (
                          <span key={i} className="text-[10px] font-medium bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-900 font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* DISTANCE FOOTER */}
                      <div className="flex items-center gap-3.5 border-t border-slate-850/80 pt-2.5 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{entity.location.city}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{distanceKm} km away</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Responds in {entity.responseTimeMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: SCORE, PRICE, ACTION */}
                    <div className="sm:w-44 flex sm:flex-col sm:items-end justify-between sm:justify-between border-t sm:border-t-0 border-slate-850 pt-3 sm:pt-0 shrink-0">
                      
                      {/* SCORE BREAKDOWN PLOT */}
                      <div className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                          <span className="text-[9px] font-bold text-slate-450 uppercase font-mono tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-violet-400" /> Rank Score
                          </span>
                          <span className="text-xs font-mono font-bold text-violet-400">{scores.total}</span>
                        </div>
                        
                        {/* MINI Neural factors distribution SVG */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                            <span>Rel / Dist</span>
                            <span>{scores.relevance} / {Math.round(scores.distance)}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden flex">
                            <div style={{ width: `${scores.relevance}%` }} className="h-full bg-blue-500" />
                            <div style={{ width: `${scores.distance}%` }} className="h-full bg-emerald-500" />
                            <div style={{ width: `${scores.trust}%` }} className="h-full bg-amber-500" />
                          </div>
                        </div>
                      </div>

                      {/* PRICE / ACTION */}
                      <div className="flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
                        {entity.pricePi !== undefined ? (
                          <div className="text-sm font-mono font-bold text-slate-150 flex items-center gap-1">
                            <span>{entity.pricePi.toFixed(2)}</span>
                            <span className="text-amber-500 font-bold text-xs">π</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400">
                            Quote Req
                          </span>
                        )}

                        {/* FAVORITE BUTTON */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleToggleFavorite(entity.id, e)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              favorites.includes(entity.id)
                                ? 'bg-rose-950/20 border-rose-500/20 text-rose-500'
                                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-450 hover:text-slate-200'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${favorites.includes(entity.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handleToggleFollow(entity.id, e)}
                            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                              followedEntities.includes(entity.id)
                                ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400'
                                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-350 hover:text-slate-100'
                            }`}
                          >
                            <Bell className="w-3 h-3" />
                            <span>{followedEntities.includes(entity.id) ? 'Following' : 'Follow'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER MODE: GEO SEARCH MAP & CLUSTERING MOCK */}
      {activeEngineView === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in" id="map_view_layout">
          {/* MAP CANVAS PANEL */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Intelligent GeoHash & Map Node Clustering</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-2.5 rounded-full">
                Active Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
              </span>
            </div>

            {/* INTERACTIVE VECTOR GRAPHICAL MAP CANVAS */}
            <div className="w-full h-96 bg-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
              
              {/* RADIAL RADAR BEACON ANCHOR */}
              <div className="absolute w-64 h-64 border border-violet-500/20 rounded-full animate-ping pointer-events-none" />
              <div className="absolute w-44 h-44 border border-indigo-500/10 rounded-full animate-ping pointer-events-none" />

              {/* GRID LINES BACKDROP */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-10 pointer-events-none">
                {Array.from({ length: 72 }).map((_, i) => (
                  <div key={i} className="border border-slate-300" />
                ))}
              </div>

              {/* CENTER USER GPS PIN CHIP */}
              <div className="absolute z-20 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-violet-600 border-2 border-slate-100 flex items-center justify-center shadow-lg shadow-violet-600/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-100 animate-pulse" />
                </div>
                <span className="bg-violet-900 text-slate-100 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-violet-700/30 mt-1 shadow-lg">
                  Alex Mercer (You)
                </span>
              </div>

              {/* CLUSTERED ENTITY POINTS ON CANVAS */}
              {searchEngineResults.map(({ entity, distanceKm }) => {
                // Compute offset percentages mapping latitude/longitude coordinates to container boundaries
                // Offset around center: (entity.location.lat - center) * multiplier
                const xOffset = 50 + (entity.location.lng - mapCenter.lng) * 450;
                const yOffset = 50 - (entity.location.lat - mapCenter.lat) * 450;

                return (
                  <div
                    key={entity.id}
                    style={{
                      left: `${Math.max(5, Math.min(95, xOffset))}%`,
                      top: `${Math.max(5, Math.min(95, yOffset))}%`
                    }}
                    onClick={() => handleLogView(entity)}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  >
                    {/* MAP PIN ICON ANCHOR */}
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-transform group-hover:scale-125 ${
                        entity.type === 'product' ? 'bg-blue-600 border-blue-400 text-blue-100' :
                        entity.type === 'service' ? 'bg-emerald-600 border-emerald-400 text-emerald-100' :
                        entity.type === 'business' ? 'bg-amber-600 border-amber-400 text-amber-100' :
                        entity.type === 'profile' ? 'bg-purple-600 border-purple-400 text-purple-100' :
                        'bg-rose-600 border-rose-400 text-rose-100'
                      }`}>
                        {entity.type === 'product' && <Store className="w-3.5 h-3.5" />}
                        {entity.type === 'service' && <Compass className="w-3.5 h-3.5" />}
                        {entity.type === 'business' && <Store className="w-3.5 h-3.5 font-bold" />}
                        {entity.type === 'profile' && <UserCheck className="w-3.5 h-3.5" />}
                        {entity.type === 'job' && <Briefcase className="w-3.5 h-3.5" />}
                      </div>
                      
                      {/* MINI TOOLTIP POP OVER ON HOVER */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col items-center bg-slate-950 border border-slate-800 p-2 rounded-xl shadow-2xl z-40 w-44">
                        <span className="text-[10px] font-bold text-slate-100 truncate w-full text-center">{entity.title}</span>
                        <span className="text-[8px] font-mono font-medium text-emerald-400 mt-0.5">{distanceKm} km away</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* RADIUS RANGE BOUNDARY SHIELD */}
              <div
                style={{
                  width: `${userRadiusKm * 4.5}px`,
                  height: `${userRadiusKm * 4.5}px`
                }}
                className="absolute border-2 border-dashed border-violet-500/20 rounded-full pointer-events-none animate-spin-slow"
              />
            </div>

            {/* GEO BENCHMARK STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Active Geohash Block</span>
                <p className="text-xs font-mono font-bold text-slate-300 mt-1">9q8yy34f (San Francisco Core)</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Nodes inside Radius</span>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                  {searchEngineResults.length} / {allEntities.length} Total listings
                </p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Coordinate Precision</span>
                <p className="text-xs font-mono font-bold text-slate-300 mt-1">&lt; 3.2 Meters (FIPS compliant)</p>
              </div>
            </div>
          </div>

          {/* MAP SIDEBAR: LIST OF DIRECT LOCATIONS */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Nearby Node Catalog</h4>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1.5">
              {searchEngineResults.map(({ entity, distanceKm }) => (
                <div
                  key={entity.id}
                  onClick={() => handleLogView(entity)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={entity.imageUrl}
                      alt={entity.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-200 truncate">{entity.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono capitalize">{entity.type}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 shrink-0">{distanceKm} km</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: FOLLOWING ENGINE POSTS UPDATES */}
      {activeEngineView === 'following' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in" id="following_view_layout">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">Following Pioneer Feed</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                {followedEntities.length} Brands Monitored
              </span>
            </div>

            {followingFeedUpdates.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-4">
                <Bell className="w-10 h-10 text-slate-650" />
                <div>
                  <h4 className="text-xs font-bold text-slate-350">No Updates Available</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Follow businesses or professionals inside the discovery feed to instantly view their live news updates, restocks, and product launches here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {followingFeedUpdates.map((post) => (
                  <div key={post.id} className="bg-slate-950 border border-slate-850 p-4.5 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.entity.imageUrl}
                          alt={post.entity.title}
                          className="w-10 h-10 rounded-full object-cover border border-slate-850"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{post.entity.title}</h4>
                          <span className="text-[9px] text-violet-450 font-mono capitalize">{post.entity.type}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">2h ago</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{post.content}</p>

                    <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-1">
                      <button
                        onClick={() => handleLogView(post.entity)}
                        className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                      >
                        Visit Catalog Profile <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER MODE: SEARCH & RECOMMENDATIONS ANALYTICS */}
      {activeEngineView === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="analytics_view_layout">
          
          {/* POPULAR SEARCH LOGS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-250 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <TrendingUp className="w-4.5 h-4.5 text-violet-400" /> Neural Search Terms Directory
            </h3>

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 text-[10px] font-mono font-bold text-slate-500 px-2 pb-1.5 border-b border-slate-850">
                <span>Query Term</span>
                <span className="text-center">Count / Searches</span>
                <span className="text-right">Click CTR %</span>
              </div>
              
              {analyticsLogs.searchQueries.map((log, i) => (
                <div
                  key={i}
                  onClick={() => setSearchQuery(log.term)}
                  className="grid grid-cols-3 items-center py-2 px-2.5 bg-slate-950 border border-slate-850/60 rounded-xl hover:border-slate-750 transition-all cursor-pointer text-xs font-medium text-slate-300"
                >
                  <span className="font-sans truncate">{log.term}</span>
                  <span className="text-center font-mono text-violet-400">{log.count}</span>
                  <span className="text-right font-mono text-emerald-400">{log.ctr}%</span>
                </div>
              ))}
            </div>

            {/* ZERO RESULT LOGS */}
            <div className="mt-2.5">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono mb-2">Zero Result Queries (Spam Monitoring)</h4>
              <div className="flex flex-wrap gap-1.5">
                {analyticsLogs.noResultsQueries.map((term, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-[11px] bg-slate-950 text-slate-400 rounded-lg font-mono border border-slate-850"
                  >
                    "{term}"
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ENGINE METRICS DASHBOARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-250 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
              <BarChart3 className="w-4.5 h-4.5 text-violet-400" /> Platform Performance Scorecard
            </h3>

            {/* PERFORMANCE VISUAL GRID */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Search Success Ratio</span>
                <p className="text-xl font-mono font-bold text-emerald-400 mt-1">98.42%</p>
                <span className="text-[8px] text-slate-550 font-mono">Fail threshold target &gt;95%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Recommendation CTR</span>
                <p className="text-xl font-mono font-bold text-violet-400 mt-1">21.5%</p>
                <span className="text-[8px] text-slate-550 font-mono">Avg platform baseline 14%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Indexing Load Rate</span>
                <p className="text-xl font-mono font-bold text-blue-450 mt-1">12,430 items/s</p>
                <span className="text-[8px] text-slate-550 font-mono">Dynamic client-side cache load</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">CTR Conversions</span>
                <p className="text-xl font-mono font-bold text-amber-400 mt-1">{analyticsLogs.recommendationConversions} leads</p>
                <span className="text-[8px] text-slate-550 font-mono">Instant wallet connection</span>
              </div>
            </div>

            {/* HISTOGRAM PLOT MOCK */}
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-mono font-bold text-slate-450 uppercase">Latency History distribution (24H)</span>
              <div className="h-28 flex items-end gap-2 px-1 border-b border-slate-800 pb-1 pt-4">
                <div className="flex-1 bg-violet-600/30 rounded-t h-[40%]" title="00:00 - 15ms" />
                <div className="flex-1 bg-violet-600/50 rounded-t h-[65%]" title="06:00 - 32ms" />
                <div className="flex-1 bg-violet-600 rounded-t h-[95%]" title="12:00 - 78ms (Peak Load)" />
                <div className="flex-1 bg-violet-600/80 rounded-t h-[75%]" title="18:00 - 45ms" />
                <div className="flex-1 bg-emerald-500 rounded-t h-[12%]" title="Current - 12ms" />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1">
                <span>00:00 UTC</span>
                <span>Peak Load</span>
                <span>Current Time</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: SECURITY SPA PROTECTION GATEWAY */}
      {activeEngineView === 'security' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in" id="security_view_layout">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5.5 h-5.5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-150">Intelligent Threat & Search Abuse Prevention Gateway</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Enterprise security safeguards preventing rating manipulation, bot searches, and sybil attacks.</p>
              </div>
            </div>

            {/* BLOCK METRICS PANEL */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Bot Requests Terminated</span>
                <p className="text-base font-mono font-bold text-rose-500 mt-1">{botDetectionStats.blockedRequests}</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Spam Listings Purged</span>
                <p className="text-base font-mono font-bold text-rose-500 mt-1">{botDetectionStats.spamListingsFlagged}</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Sybil Trend Attempts</span>
                <p className="text-base font-mono font-bold text-rose-500 mt-1">{botDetectionStats.fakeTrendingAttemptsBlocked}</p>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">System Audits Logged</span>
                <p className="text-base font-mono font-bold text-emerald-400 mt-1">{botDetectionStats.trustVerificationAudits}</p>
              </div>
            </div>

            {/* SECURITY LOG CONSOLE */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs flex flex-col gap-2 shadow-inner">
              <span className="text-[10px] font-bold text-slate-500 border-b border-slate-900 pb-1 mb-1">Live Firewall Log (Simulated Node Stream)</span>
              <div className="flex gap-2 text-rose-400">
                <span className="text-slate-600 shrink-0">[06:11:02]</span>
                <p>BLOCKED IP 185.220.101.4 - Reason: RateLimit abuse. Bot pattern detected on universal search.</p>
              </div>
              <div className="flex gap-2 text-amber-400">
                <span className="text-slate-600 shrink-0">[06:11:15]</span>
                <p>AUDITED Listing: "seed_prod_1" - Trust metrics verified. CTR conversion aligns with real wallet balance.</p>
              </div>
              <div className="flex gap-2 text-slate-400">
                <span className="text-slate-600 shrink-0">[06:12:00]</span>
                <p>GEOHASH Index sync success. 43 nodes mapping within FIPS precision range limits.</p>
              </div>
              <div className="flex gap-2 text-emerald-400">
                <span className="text-slate-600 shrink-0">[06:12:14]</span>
                <p>SECURE SECRETS check: No developer API keys leaked inside public Javascript client payload.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DETAIL DETAIL DIALOG MODAL */}
      <AnimatePresence>
        {selectedEntity && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedEntity(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-500 hover:text-slate-200 transition-all border border-slate-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col gap-4.5">
                <img
                  src={selectedEntity.imageUrl}
                  alt={selectedEntity.title}
                  className="w-full h-44 object-cover rounded-2xl border border-slate-850"
                  referrerPolicy="no-referrer"
                />

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-100 font-sans">{selectedEntity.title}</h3>
                    {selectedEntity.verified && <CheckCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-400 font-bold">{selectedEntity.subtitle}</p>
                </div>

                <p className="text-xs text-slate-350 leading-relaxed font-medium">{selectedEntity.description}</p>

                {/* DIAGNOSTIC ALGORITHM TRACE */}
                <div className="bg-slate-950 border border-slate-850/80 p-3.5 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Scoring Breakdown Parameters
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <div className="flex justify-between border-b border-slate-900 py-1">
                      <span>Query Relevance:</span>
                      <span className="text-blue-400 font-bold">{selectedEntity.ctr > 20 ? 100 : 70}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 py-1">
                      <span>Proximity Multiplier:</span>
                      <span className="text-emerald-400 font-bold">Excellent</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 py-1">
                      <span>Account Trust:</span>
                      <span className="text-amber-400 font-bold">{selectedEntity.trustScore}/100</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 py-1">
                      <span>Satisfaction rate:</span>
                      <span className="text-purple-400 font-bold">{selectedEntity.customerSatisfaction}%</span>
                    </div>
                  </div>
                </div>

                {/* FOOTER VALUES & DIRECT ROUTING LINK */}
                <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-1.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-550 uppercase font-bold">Consensus value</span>
                    {selectedEntity.pricePi !== undefined ? (
                      <p className="text-base font-mono font-bold text-slate-150 flex items-baseline gap-1">
                        {selectedEntity.pricePi.toFixed(2)} <span className="text-amber-500 text-xs">π</span>
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">Quote Required</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFavorite(selectedEntity.id)}
                      className={`px-3 py-2 border rounded-xl transition-all ${
                        favorites.includes(selectedEntity.id)
                          ? 'bg-rose-950/20 border-rose-500/20 text-rose-500'
                          : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(selectedEntity.id) ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedEntity(null);
                        // Route to appropriate original page view
                        if (selectedEntity.type === 'product') {
                          onNavigate('marketplace');
                        } else if (selectedEntity.type === 'service') {
                          onNavigate('marketplace', { tab: 'services' });
                        } else if (selectedEntity.type === 'job') {
                          onNavigate('marketplace', { tab: 'jobs' });
                        } else if (selectedEntity.type === 'business') {
                          onNavigate('store_page', { storeId: selectedEntity.id });
                        } else if (selectedEntity.type === 'profile') {
                          onNavigate('profile_engine');
                        }
                      }}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Access Listing Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
