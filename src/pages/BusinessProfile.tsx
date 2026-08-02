import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { businessProfileService } from '../services/businessProfileService';
import { BUSINESS_PROFILE_CONFIG } from '../config/businessProfileConfig';
import { BusinessProfileForm } from '../components/BusinessProfileForm';
import Navbar from '../components/Navbar';
import { Edit2, Eye, MapPin, Mail, Phone, Globe, Shield, Star, Briefcase, ExternalLink, Camera, MessageSquare } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { DangerZoneCard } from '../components/danger/DangerZoneCard';
import { DeleteConfirmationModal } from '../components/danger/DeleteConfirmationModal';
import { DeleteProgressDialog } from '../components/danger/DeleteProgressDialog';

export const BusinessProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // This could be businessId, storeId, etc.
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!id) return;
    setDeleteStatus('Deleting business...');
    try {
      const response = await fetch('/api/delete-resource', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType: 'business', resourceId: id }),
      });
      if (!response.ok) throw new Error('Failed to delete');
      navigate('/');
    } catch (err) {
      console.error(err);
      setDeleteStatus(null);
      setShowDeleteModal(false);
      alert('Failed to delete');
    }
  };
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (profileData) {
        const isStorePath = window.location.pathname.includes('/store/');
        if (isStorePath) {
          (window as any).__currentStoreProfile = profileData;
          (window as any).__currentBusinessProfile = null;
        } else {
          (window as any).__currentBusinessProfile = profileData;
          (window as any).__currentStoreProfile = null;
        }
      } else {
        (window as any).__currentStoreProfile = null;
        (window as any).__currentBusinessProfile = null;
      }
    }
  }, [profileData]);

  useEffect(() => {
    const fetchStoreItems = async () => {
      if (!profileData?.ownerUid) return;
      try {
        const db = getFirebaseDb();
        const collectionName = profileData.businessType === 'service provider' || profileData.businessType === 'services' ? 'services' : 'products';
        const q = query(
          collection(db, collectionName),
          where('ownerUid', '==', profileData.ownerUid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.productName || data.serviceName || data.name || data.title || 'Untitled',
            price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0),
            currency: data.currency || 'π',
            oldPrice: typeof data.oldPrice === 'string' ? parseFloat(data.oldPrice) : (data.oldPrice || data.discount || 0),
            image: data.imageUrl || data.image || data.coverImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            category: data.category || 'General',
            rating: typeof data.rating === 'number' ? data.rating : (data.rating ? parseFloat(data.rating) : 4.8),
            reviews: typeof data.reviews === 'number' ? data.reviews : (data.reviewCount || 12),
            type: collectionName === 'services' ? 'service' : 'product'
          };
        });
        setStoreProducts(list);
      } catch (err) {
        console.error("Error fetching store items:", err);
      }
    };
    fetchStoreItems();
  }, [profileData]);

  // If there is no ID, we are trying to edit the active role of the current user.
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        if (id) {
          const isStorePath = window.location.pathname.includes('/store/');
          const primaryCollection = isStorePath ? 'stores' : 'businesses';

          console.log('[BusinessProfile Runtime Trace]', {
            receivedRouteParams: { id },
            firestoreCollectionQueried: primaryCollection,
            firestoreDocumentIdQueried: id,
          });

          // Public view (or owner viewing their own via ID)
          const data = await businessProfileService.getProfileById(id);

          console.log('[BusinessProfile Runtime Trace Result]', {
            queryResult: data ? 'Document Found' : 'Document Not Found',
            documentData: data
          });

          if (data) {
            setProfileData(data);
          } else {
            console.error("Profile not found");
          }
        } else {
          console.error("No ID provided for BusinessProfile");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id, user]);

  const handleSave = async (data: any, publish: boolean) => {
    if (!user) return;
    try {
      setSaving(true);
      const activeRole = profileData?.businessType || (user as any).activeRole || 'seller';
      const newId = await businessProfileService.saveProfile(user.uid, activeRole, data, publish);
      // Reload
      const updated = await businessProfileService.getProfileById(newId);
      setProfileData(updated);
      setIsEditing(false);
      if (!id) {
        navigate(`/business/${newId}`);
      }
    } catch (err) {
      console.error("Error saving profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading profile...</div>;
  }

  if (!profileData && !isEditing) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Profile not found.</div>;
  }

  const role = profileData?.businessType || 'seller';
  const roleConfig = BUSINESS_PROFILE_CONFIG[role] || BUSINESS_PROFILE_CONFIG['seller'];
  const isOwner = user && profileData && user.uid === profileData.ownerUid;

  const handleMessageBusiness = () => {
    if (!profileData || !user) return;
    navigate('/inbox', {
      state: {
        targetUid: profileData.ownerUid,
        targetName: profileData.businessName,
        contextType: 'business_customer',
        contextId: profileData.businessId || profileData.ownerUid
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Navbar 
        currentUser={user as any}
        currentView="dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover & Avatar Header */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 mb-8">
          <div className="aspect-[16/9] md:aspect-[3/1] bg-gradient-to-tr from-violet-900/40 to-indigo-900/40 w-full relative overflow-hidden">
            {profileData?.coverImageUrl && (
              <img src={profileData.coverImageUrl} alt="Cover" className="w-full h-full object-cover opacity-50" />
            )}
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            {isOwner && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl text-sm font-bold text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                {isEditing ? <><Eye className="w-4 h-4" /> View Public</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
              </button>
            )}
          </div>
          <div className="px-8 pb-8 pt-0 relative z-10 flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-24">
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] rounded-2xl bg-slate-800 border-4 border-slate-950 flex items-center justify-center shadow-xl overflow-hidden shrink-0 aspect-square">
              {profileData?.logoUrl ? (
                <img src={profileData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Briefcase className="w-16 h-16 text-slate-600" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-wider border border-violet-500/20">
                  {roleConfig.roleId}
                </span>
                {profileData?.status === 'active' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{profileData?.businessName || 'Unnamed Business'}</h1>
              <p className="text-slate-400 font-medium">{profileData?.category || 'No category specified'}</p>
            </div>
          </div>
        </div>
        {/* Render content ... omitted ... */}
        {isOwner && (
          <div className="mt-8 border-t border-slate-900 pt-8">
            <DangerZoneCard
              title="Danger Zone"
              description="Irreversible administrative controls for this business profile. Permanent deletion will remove all associated stores, listings, and metadata."
              onDeleteRequested={() => setShowDeleteModal(true)}
            />
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        resourceName={profileData?.name || 'this business'}
      />
      {deleteStatus && <DeleteProgressDialog isOpen={!!deleteStatus} status={deleteStatus} />}
    </div>
  );
};
