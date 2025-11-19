'use client';

import { motion } from 'framer-motion';
import { Heart, Target, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fb] py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Section 1 - Tribute */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-24"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="card-luxury p-8 md:p-12 bg-gradient-to-br from-white to-[#f8f9fb]">
              <Heart className="mx-auto mb-6 text-accent-primary" size={48} />
              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-display font-semibold text-text-primary leading-relaxed mb-6 italic">
                "I will never forget you, Ahemad. You were my inspiration — whatever I am now, it is because of you."
              </blockquote>
              <p className="text-lg md:text-xl text-text-secondary font-medium">
                — Solomon
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 2 - Our Journey */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16 md:mb-24"
        >
          <div className="max-w-4xl mx-auto">
            <div className="card-luxury p-8 md:p-12">
              <div className="flex items-center mb-6">
                <Target className="text-accent-primary mr-4" size={32} />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-primary">
                  Our Journey
                </h2>
              </div>
              <p className="text-base md:text-lg text-text-secondary leading-relaxed whitespace-pre-line">
                Hey there! 👋{'\n\n'}
                We're a full‑service warehouse facility management company specialising in reliable, flexible rental warehouses. Our spaces are designed to match your storage needs—whether you're a growing e‑commerce brand needing rapid turnover or a manufacturer requiring long‑term bulk storage.{'\n\n'}
                Let us know your specific requirements—size, location preference, or any value‑add services you need—and we'll tailor a solution that fits perfectly. 🚚🏭
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 3 - About Us */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="max-w-4xl mx-auto">
            <div className="card-luxury p-8 md:p-12">
              <div className="flex items-center mb-6">
                <Users className="text-accent-primary mr-4" size={32} />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-primary">
                  About Us
                </h2>
              </div>
              <p className="text-base md:text-lg text-text-secondary leading-relaxed whitespace-pre-line">
                We are a full-service property consulting firm dedicated to delivering expert solutions across the real estate spectrum. Our services include property sourcing, lease/ sale management, valuation, market research, and investment advisory—all driven by deep market insight and personalized service.{'\n\n'}
                With a client-first approach, we partner with investors, corporates, and individuals to unlock property potential and achieve strategic goals.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

