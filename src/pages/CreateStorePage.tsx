import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreWizard } from '../components/store/StoreWizard';
import { useAuth } from '../auth/useAuth';

export const CreateStorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Your Store</h2>
        <p className="mt-2 text-sm text-slate-400 font-medium max-w-xs mx-auto">
          Set up your digital storefront to showcase and sell products and services.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <StoreWizard
          onComplete={(storeId) => {
            console.log('Store created:', storeId);
            // After Store creation, enable Add Product/Service and redirect to Dashboard
            navigate('/dashboard', { replace: true });
          }}
          onCancel={() => {
            navigate(-1);
          }}
        />
      </div>
    </div>
  );
};
