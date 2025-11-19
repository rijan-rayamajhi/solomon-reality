'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { StatsSection } from '@/components/home/StatsSection';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen">
      <HeroSection />
      {isAdmin && <StatsSection />}
      <FeaturedProperties />
    </div>
  );
}

