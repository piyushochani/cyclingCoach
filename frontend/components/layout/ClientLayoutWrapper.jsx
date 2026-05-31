"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import PostLoginNavbar from './PostLoginNavbar';
import GeneralFooter from './GeneralFooter';
import PaceBotChat from '../ui/PaceBotChat';
import PageTransitionWrapper from '../animations/PageTransitionWrapper';
import AuthGuard from './AuthGuard';
import StravaConnectOverlay from './StravaConnectOverlay';
import ModelChangeBanner from './ModelChangeBanner';

const publicPaths = ['/', '/login', '/signup', '/forgot-password'];

const ClientLayoutWrapper = ({ children }) => {
  const pathname = usePathname();
  const isPublic = publicPaths.includes(pathname);

  return (
    <AuthGuard>
      <StravaConnectOverlay>
        <div className="min-h-screen bg-bg-dark text-text-primary">
          {!isPublic && <PostLoginNavbar />}
          {!isPublic && <ModelChangeBanner />}
          <main className={!isPublic ? 'pt-20' : ''}>
            <PageTransitionWrapper>
              {children}
            </PageTransitionWrapper>
          </main>
          {!isPublic && <GeneralFooter />}
          {!isPublic && <PaceBotChat />}
        </div>
      </StravaConnectOverlay>
    </AuthGuard>
  );
};

export default ClientLayoutWrapper;
