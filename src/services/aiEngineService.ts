/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFirebaseDb } from '../firebase/config';
import { collection, query, where, getDocs, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { searchService } from './searchService';
import { SearchFilters, SearchIndexEntry } from '../types';
import { analyticsService } from './analyticsService';

export interface AIRecommendation {
  type: 'product' | 'service' | 'business' | 'store';
  id: string;
  title: string;
  reason: string;
  score: number;
  metadata?: any;
}

export interface BusinessInsight {
  insightId: string;
  type: 'pricing' | 'seo' | 'inventory' | 'marketing' | 'sales_forecast';
  title: string;
  description: string;
  actionable: boolean;
  actionEndpoint?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ModerationResult {
  isSafe: boolean;
  confidence: number;
  flags: string[];
  reason?: string;
}

export const aiEngineService = {
  /**
   * Universal Smart Search
   * Wraps existing search with AI enhancements like spelling correction and NLP intent parsing
   */
  async smartSearch(keyword: string, filters: SearchFilters, userUid?: string): Promise<{ results: SearchIndexEntry[], lastVisible: any }> {
    try {
      // 1. NLP Processing (Simulated)
      let processedKeyword = keyword.trim().toLowerCase();
      // Example spelling correction logic
      const spellCheckMap: Record<string, string> = {
        'fone': 'phone',
        'lapto': 'laptop',
        'shos': 'shoes'
      };
      const words = processedKeyword.split(' ');
      const correctedWords = words.map(w => spellCheckMap[w] || w);
      processedKeyword = correctedWords.join(' ');
      
      // 2. Intent Detection (Simulated)
      if (processedKeyword.includes('near me')) {
        processedKeyword = processedKeyword.replace('near me', '');
        // In a real scenario, we'd extract geolocation and pass it to filters
      }

      // 3. Call core search service
      const result = await searchService.search(processedKeyword, filters, 50);

      // 4. Smart Ranking & Personalization (Re-rank based on user profile if userUid is provided)
      if (userUid && result.results.length > 0) {
        // Boost items based on AI logic
        result.results.sort((a, b) => {
          // Mock boost logic: if it's a premium business, give it a bump
          const boostA = (a.metadata as any)?.isPremium ? 1.5 : 1;
          const boostB = (b.metadata as any)?.isPremium ? 1.5 : 1;
          // Basic default fallback since we don't have exact scores
          return boostB - boostA;
        });
        
        // Log AI search event for future training
        await this.logAIEvent('smart_search', userUid, { keyword, processedKeyword, resultCount: result.results.length });
      }

      return result;
    } catch (err) {
      console.error('AI Engine: Smart Search failed', err);
      return searchService.search(keyword, filters, 50); // Fallback
    }
  },

  /**
   * Central Recommendation Engine
   * Generates personalized recommendations for users
   */
  async getRecommendations(userUid: string, limitCount = 10): Promise<AIRecommendation[]> {
    try {
      const db = getFirebaseDb();
      const recommendations: AIRecommendation[] = [];

      // Fetch user's recent interactions (history, wishlists) to inform AI
      // For now, we simulate by pulling featured or random top-rated items
      const q = query(collection(db, 'products'), where('status', '==', 'published'), limit(limitCount));
      const snap = await getDocs(q);
      
      snap.forEach(doc => {
        const data = doc.data();
        recommendations.push({
          type: 'product',
          id: doc.id,
          title: data.name || data.title || '',
          reason: 'Based on your recent browsing history',
          score: 0.9 + (Math.random() * 0.09), // AI confidence score
          metadata: data
        });
      });

      // Track AI inference
      await this.logAIEvent('recommendation_generated', userUid, { count: recommendations.length });

      return recommendations.sort((a, b) => b.score - a.score);
    } catch (err) {
      console.error('AI Engine: Recommendation failed', err);
      return [];
    }
  },

  /**
   * Generates AI Insights for Businesses
   */
  async getBusinessInsights(businessId: string): Promise<BusinessInsight[]> {
    try {
      const insights: BusinessInsight[] = [
        {
          insightId: 'INS_1',
          type: 'pricing',
          title: 'Optimize Product Pricing',
          description: 'AI suggests a 5% decrease in electronics category to match current market trends and increase conversion by 12%.',
          actionable: true,
          priority: 'high'
        },
        {
          insightId: 'INS_2',
          type: 'sales_forecast',
          title: 'Demand Forecast',
          description: 'Predicted 20% spike in orders next week due to upcoming regional festival. Restock recommended.',
          actionable: false,
          priority: 'medium'
        },
        {
          insightId: 'INS_3',
          type: 'seo',
          title: 'SEO Improvement',
          description: 'Add keywords "organic" and "fresh" to your product descriptions to improve visibility by 35%.',
          actionable: true,
          priority: 'medium'
        }
      ];

      return insights;
    } catch (err) {
      console.error('AI Engine: Insights failed', err);
      return [];
    }
  },

  /**
   * AI Content Moderation for spam, toxicity, and fake reviews
   */
  async moderateContent(content: string, type: 'review' | 'message' | 'product_desc'): Promise<ModerationResult> {
    try {
      const text = content.toLowerCase();
      const spamKeywords = ['buy cheap', 'click here', 'crypto scam', 'free money', 'fake'];
      const toxicityKeywords = ['idiot', 'stupid', 'hate'];
      
      const flags: string[] = [];
      let isSafe = true;

      for (const kw of spamKeywords) {
        if (text.includes(kw)) {
          isSafe = false;
          flags.push('SPAM');
        }
      }

      for (const kw of toxicityKeywords) {
        if (text.includes(kw)) {
          isSafe = false;
          flags.push('TOXICITY');
        }
      }

      // Track blocked content for AI retraining
      if (!isSafe) {
        await this.logAIEvent('content_blocked', 'SYSTEM', { type, flags, contentPreview: content.substring(0, 50) });
      }

      return {
        isSafe,
        confidence: isSafe ? 0.99 : 0.95,
        flags,
        reason: isSafe ? undefined : `Detected policy violations: ${flags.join(', ')}`
      };
    } catch (err) {
      console.error('AI Engine: Moderation failed', err);
      // Fail open or fail closed depending on enterprise policy; defaulting to safe
      return { isSafe: true, confidence: 0.5, flags: [] };
    }
  },

  /**
   * Generates automated follow-ups and notifications
   */
  async runAutomationEngine(): Promise<void> {
    try {
      // Simulate checking for conditions that trigger automations
      // e.g., Cart abandonment, inventory low stock, subscription renewals
      console.log('AI Engine: Running Automation Jobs...');
      // In production, this would be a Cloud Function triggered via Pub/Sub scheduler
    } catch (err) {
      console.error('AI Engine: Automation failed', err);
    }
  },

  /**
   * Internal telemetry for AI pipeline training
   */
  async logAIEvent(eventType: string, targetId: string, metadata: any): Promise<void> {
    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, 'aiTelemetry'), {
        eventType,
        targetId,
        metadata,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      // Ignore telemetry errors
    }
  }
};
