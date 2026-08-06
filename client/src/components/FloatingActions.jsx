import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, MessageSquareHeart } from 'lucide-react';
import ChatBot from './ChatBot';

const FloatingActions = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 100,
      }}>
        <AnimatePresence>
          {isVisible && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToTop}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--card-bg, #fff)',
                color: 'var(--text, #333)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat toggle button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: isChatOpen ? '#764ba2' : '#f48fb1',
            color: '#fff',
            border: 'none',
            boxShadow: isChatOpen
              ? '0 4px 20px rgba(118, 75, 162, 0.5)'
              : '0 4px 15px rgba(244, 143, 177, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background-color 0.3s, box-shadow 0.3s',
          }}
        >
          <AnimatePresence mode="wait">
            {isChatOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '24px', lineHeight: 1 }}
              >✕</motion.span>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageSquareHeart size={28} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse ring when closed */}
          {!isChatOpen && (
            <motion.div
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid #f48fb1',
                pointerEvents: 'none',
              }}
            />
          )}
        </motion.button>
      </div>

      {/* Chat window */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default FloatingActions;
