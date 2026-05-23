import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

// Don't show SOS button on pages where emergency is already the focus
const HIDDEN_ROUTES = ['/emergency', '/dashboard/donor', '/dashboard/bloodbank'];

const SOSFloatingButton: React.FC = () => {
  const location = useLocation();
  const isHidden = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ delay: 0.5 }}
          className="fixed left-4 sm:left-6 bottom-6 z-40"
        >
          <Link
            to="/emergency"
            className="flex items-center bg-critical text-white px-4 py-3 rounded-xl shadow-lg shadow-red-500/30 font-bold text-sm hover:bg-red-600 transition-colors relative overflow-hidden group"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 bg-white opacity-20 rounded-xl animate-ping group-hover:opacity-0 transition-opacity"></span>
            <AlertCircle className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">SOS Emergency</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SOSFloatingButton;
