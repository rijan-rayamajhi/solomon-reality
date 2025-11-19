'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-display font-bold text-accent-primary mb-4">
              Covenant Realty
            </h3>
            <p className="text-text-secondary leading-relaxed text-base">
              Your trusted partner in finding premium real estate properties
              across India.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/properties" className="text-text-secondary hover:text-accent-primary transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Properties
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-text-secondary hover:text-accent-primary transition-colors inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  About Us
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-accent-primary flex-shrink-0" />
                <a href="mailto:agnijwala202222@gmail.com" className="hover:text-accent-primary transition-colors">
                  agnijwala202222@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-accent-primary flex-shrink-0" />
                <a href="tel:+917337058554" className="hover:text-accent-primary transition-colors">
                  +91 7337058554
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin size={18} className="text-accent-primary flex-shrink-0" />
                <span>Hyderabad, India</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-secondary text-sm">
              &copy; {new Date().getFullYear()} Covenant Realty. All rights reserved.
            </p>
            <p className="text-text-secondary text-sm">
              Maintained by{' '}
              <a
                href="https://spotwebs.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-primary-hover font-semibold transition-colors"
              >
                Spotwebs
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
