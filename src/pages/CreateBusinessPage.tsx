import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessWizard } from '../components/business/BusinessWizard';
import { useAuth } from '../auth/useAuth';

export const CreateBusinessPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Your Business</h2>
        <p className="mt-2 text-sm text-slate-400 font-medium max-w-xs mx-auto">
          Establish your enterprise profile on the Pi Network Marketplace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <BusinessWizard
          onComplete={async (businessId) => {
            console.log('Business created:', businessId);
            // Once the first business is successfully created:
            // - update user profile, preserve existing fields, do NOT overwrite profile data
            try {
              if (updateUser) {
                await updateUser({
                  profileCompleted: true,
                  onboardingCompleted: true,
                  activeRole: 'seller',
                  roles: Array.from(new Set([...(user.roles || []), 'seller', 'buyer']))
                });
              }
            } catch (err) {
              console.error('Failed to update user profile on business creation:', err);
            }
            // After Business creation, redirect to "Create Store"
            navigate('/create-store', { replace: true });
          }}
          onCancel={() => {
            navigate(-1);
          }}
        />
      </div>
    </div>
  );
};
