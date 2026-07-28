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
import OnboardingChat from './OnboardingChat';
import PlanAutoGenerator from './PlanAutoGenerator';
import { useAutoSync } from '../../lib/useAutoSync';

const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/privacy', '/terms', '/cookie-policy', '/pricing', '/admin', '/admin/login'];

function AuthenticatedShell({ children, isPublic, pathname }) {
  useAutoSync();
  return (
    <StravaConnectOverlay>
      <div className="min-h-screen bg-bg-dark text-text-primary">
        {!isPublic && <PostLoginNavbar />}
        {!isPublic && <ModelChangeBanner />}
        <main className={!isPublic ? 'pt-[63px]' : ''}>
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
        </main>
        {!isPublic && <GeneralFooter />}
        {!isPublic && <PaceBotChat />}
        {!isPublic && pathname !== '/auth/strava/callback' && <OnboardingChat />}
        {!isPublic && <PlanAutoGenerator />}
      </div>
    </StravaConnectOverlay>
  );
}

const ClientLayoutWrapper = ({ children }) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isPublic = publicPaths.includes(pathname);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      {isPublic ? (
        <div className="min-h-screen bg-bg-dark text-text-primary">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </div>
      ) : (
        <AuthenticatedShell isPublic={isPublic} pathname={pathname}>{children}</AuthenticatedShell>
      )}
    </AuthGuard>
  );
};

export default ClientLayoutWrapper;
