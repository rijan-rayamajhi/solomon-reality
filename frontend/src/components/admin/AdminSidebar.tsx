'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Mail, TrendingUp, Users, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: Home,
    },
    {
      title: 'Properties',
      href: '/admin/properties',
      icon: Building2,
    },
    {
      title: 'Leads',
      href: '/admin/leads',
      icon: Mail,
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: TrendingUp,
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-display font-bold text-accent-primary">
          Admin Panel
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          {user?.name || 'Admin'}
        </p>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary border-l-4 border-accent-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.title}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

