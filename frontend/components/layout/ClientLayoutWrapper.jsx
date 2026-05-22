"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import PostLoginNavbar from './PostLoginNavbar';
import PaceBotChat from '../ui/PaceBotChat';
import PageTransitionWrapper from '../animations/PageTransitionWrapper';
import AuthGuard from './AuthGuard';

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];

const ClientLayoutWrapper = ({ children }) => {
  const pathname = usePathname();
  const isPublic = publicPaths.includes(pathname);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-dark text-text-primary">
        {!isPublic && <PostLoginNavbar />}
        <main className={!isPublic ? 'pt-20' : ''}>
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
        </main>
        {!isPublic && <PaceBotChat />}
      </div>
    </AuthGuard>
  );
};

export default ClientLayoutWrapper;
