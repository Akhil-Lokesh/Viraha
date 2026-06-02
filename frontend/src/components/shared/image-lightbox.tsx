'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Box } from '@mui/material';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoomed(false);
    }
  }, [open, initialIndex]);

  // Move focus into the dialog when it opens so keyboard nav and screen
  // readers start inside the lightbox.
  useEffect(() => {
    if (open) {
      containerRef.current?.focus();
    }
  }, [open]);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((i) => i + 1);
      setZoomed(false);
    }
  }, [currentIndex, images.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setZoomed(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'Tab': {
          // Trap focus within the dialog so tabbing never leaves the lightbox.
          const container = containerRef.current;
          if (!container) break;
          const focusable = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) {
            e.preventDefault();
            container.focus();
            break;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;
          if (e.shiftKey) {
            if (active === first || active === container) {
              e.preventDefault();
              last.focus();
            }
          } else if (active === last || active === container) {
            // From the last element OR the container itself, forward-Tab wraps to
            // the first focusable element instead of escaping the dialog.
            e.preventDefault();
            first.focus();
          }
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, goNext, goPrev]);

  if (images.length === 0) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.95)',
            outline: 'none',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Top bar */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
              }}
            >
              {currentIndex + 1} / {images.length}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                sx={{
                  display: 'flex',
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                {zoomed ? (
                  <ZoomOut style={{ height: 20, width: 20 }} />
                ) : (
                  <ZoomIn style={{ height: 20, width: 20 }} />
                )}
              </Box>
              <Box
                component="button"
                onClick={onClose}
                aria-label="Close"
                sx={{
                  display: 'flex',
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <X style={{ height: 20, width: 20 }} />
              </Box>
            </Box>
          </Box>

          {/* Main image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src={images[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              onClick={() => setZoomed((z) => !z)}
              draggable={false}
              sx={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                userSelect: 'none',
                transition: 'transform 0.3s',
                transform: zoomed ? 'scale(1.5)' : 'scale(1)',
                cursor: zoomed ? 'zoom-out' : 'zoom-in',
              }}
            />
          </motion.div>

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <Box
              component="button"
              onClick={goPrev}
              aria-label="Previous photo"
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                display: 'flex',
                height: 48,
                width: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ChevronLeft style={{ height: 24, width: 24 }} />
            </Box>
          )}
          {currentIndex < images.length - 1 && (
            <Box
              component="button"
              onClick={goNext}
              aria-label="Next photo"
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                display: 'flex',
                height: 48,
                width: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ChevronRight style={{ height: 24, width: 24 }} />
            </Box>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: '9999px',
                bgcolor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {images.map((img, idx) => (
                <Box
                  component="button"
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomed(false);
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: idx === currentIndex ? '#fff' : 'transparent',
                    transform: idx === currentIndex ? 'scale(1.1)' : 'scale(1)',
                    opacity: idx === currentIndex ? 1 : 0.6,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    p: 0,
                    bgcolor: 'transparent',
                    '&:hover': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    draggable={false}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
