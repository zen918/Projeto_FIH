import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

const SIDEBAR_KEY = 'pytangy.sidebar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(SIDEBAR_KEY) === 'collapsed',
  );
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  return (
    <div className="min-h-screen md:flex">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-32 pt-6 sm:px-6 md:px-8 md:pb-12">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
