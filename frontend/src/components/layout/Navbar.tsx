'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import { Home, Search, Heart, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch site settings (logo) - public endpoint, no auth required
  const { data: settingsData } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      try {
        const response = await settingsApi.getPublicSettings();
        return response.data;
      } catch (error) {
        // If settings not available, return empty
        return { settings: {} };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const logoUrl = settingsData?.settings?.logo;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const isHomePage = pathname === '/';

  return (
    <motion.nav
      initial={false}
      animate={{
        backgroundColor: isScrolled || !isHomePage ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: isScrolled || !isHomePage ? 'none' : 'blur(20px)',
        borderBottomColor: isScrolled || !isHomePage ? '#E5E7EB' : 'rgba(229, 231, 235, 0.5)',
      }}
      transition={{ duration: 0.3, ease: [0.22, 0.9, 0.38, 1] }}
      className="sticky top-0 z-50 border-b transition-all duration-300"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              {logoUrl ? (
                <div className="relative h-14 md:h-16 w-auto max-w-[280px] md:max-w-[320px] min-w-[160px] md:min-w-[180px]">
                  <Image
                    src={logoUrl}
                    alt="Company Logo"
                    width={320}
                    height={64}
                    className="object-contain h-14 md:h-16 w-auto"
                    sizes="(max-width: 768px) 200px, 320px"
                    priority
                  />
                </div>
              ) : (
                <h1 className="text-2xl md:text-3xl font-display font-bold text-accent-primary">
                  Covenant Realty
                </h1>
              )}
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/" icon={<Home size={18} />} label="Home" pathname={pathname} />
            <NavLink href="/properties" icon={<Search size={18} />} label="Properties" pathname={pathname} />
            
            {isAuthenticated ? (
              <>
                <NavLink href="/wishlist" icon={<Heart size={18} />} label="Wishlist" pathname={pathname} />
                {isAdmin && <NavLink href="/admin" icon={<Settings size={18} />} label="Admin" pathname={pathname} />}
                <NavLink href="/profile" icon={<User size={18} />} label={user?.name || 'Profile'} pathname={pathname} />
                <Button variant="ghost" onClick={handleLogout} size="sm">
                  <LogOut size={18} className="mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
                  Login
                </Link>
                <Button variant="primary" size="sm" href="/register">
                  Register
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-apple text-text-primary hover:bg-surface-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 right-0 bg-surface border-b border-border shadow-large z-50 md:hidden"
            >
              <div className="container mx-auto px-4 py-6 space-y-2">
                <MobileNavLink href="/" icon={<Home size={20} />} label="Home" pathname={pathname} onClick={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/properties" icon={<Search size={20} />} label="Properties" pathname={pathname} onClick={() => setMobileMenuOpen(false)} />
                {isAuthenticated ? (
                  <>
                    <MobileNavLink href="/wishlist" icon={<Heart size={20} />} label="Wishlist" pathname={pathname} onClick={() => setMobileMenuOpen(false)} />
                    {isAdmin && <MobileNavLink href="/admin" icon={<Settings size={20} />} label="Admin" pathname={pathname} onClick={() => setMobileMenuOpen(false)} />}
                    <MobileNavLink href="/profile" icon={<User size={20} />} label={user?.name || 'Profile'} pathname={pathname} onClick={() => setMobileMenuOpen(false)} />
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-apple text-error hover:bg-surface-muted transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 rounded-apple text-text-secondary hover:bg-surface-muted transition-colors">
                      <span>Login</span>
                    </Link>
                    <Button variant="primary" className="w-full" href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Register
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
}

function NavLink({ href, icon, label, pathname }: NavLinkProps) {
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link href={href} className="relative px-4 py-2 rounded-apple transition-colors group">
      <span className={`relative z-10 flex items-center gap-2 ${
        isActive
          ? 'text-accent-primary font-semibold'
          : 'text-text-secondary hover:text-text-primary'
      }`}>
        {icon}
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-accent-primary/10 rounded-apple"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}

interface MobileNavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  onClick: () => void;
}

function MobileNavLink({ href, icon, label, pathname, onClick }: MobileNavLinkProps) {
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-apple transition-colors ${
        isActive
          ? 'bg-accent-primary/10 text-accent-primary font-semibold'
          : 'text-text-secondary hover:bg-surface-muted'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
