'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { CIN, glowRing, photoVignette } from '@/lib/design/cinema-tokens';

interface PhotoUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function PhotoUpload({ files, onChange, maxFiles = 10 }: PhotoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const reduceMotion = useReducedMotion();

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles).filter((f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
      );
      const combined = [...files, ...arr].slice(0, maxFiles);
      onChange(combined);
    },
    [files, maxFiles, onChange]
  );

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  // Memoize object URLs to prevent re-creation on every render; revoke stale
  // URLs when the file set changes (and on unmount) to avoid leaking blobs.
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {files.length < maxFiles && (
        <motion.label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 192,
            border: '1px dashed',
            borderRadius: 14,
            cursor: 'pointer',
            transition: 'border-color 0.25s, background-color 0.25s, box-shadow 0.25s',
            borderColor: dragOver ? 'var(--cin-accent, #8B7CFF)' : 'rgba(255,255,255,0.14)',
            backgroundColor: dragOver
              ? 'rgba(139,124,255,0.08)'
              : 'var(--cin-surface, #141419)',
            boxShadow: dragOver ? glowRing(1) : 'none',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          whileHover={reduceMotion ? undefined : { scale: 1.005 }}
          whileTap={reduceMotion ? undefined : { scale: 0.995 }}
        >
          <motion.div
            animate={dragOver && !reduceMotion ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              <Camera
                style={{
                  height: 40,
                  width: 40,
                  marginBottom: 12,
                  transition: 'color 0.3s',
                  color: dragOver
                    ? 'var(--cin-accent, #8B7CFF)'
                    : 'var(--cin-text-muted, #9A9AA6)',
                }}
              />
            </motion.div>
          </motion.div>

          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.3s',
              color: dragOver ? 'var(--cin-accent, #8B7CFF)' : 'var(--cin-text, #F4F4F6)',
            }}
          >
            Drop your travel photos here
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'var(--cin-text-muted, #9A9AA6)',
              mt: 0.5,
            }}
          >
            or click to browse
          </Typography>
          <Box
            component="span"
            sx={{
              fontSize: '0.75rem',
              mt: 1.5,
              px: 1.5,
              py: 0.5,
              borderRadius: '9999px',
              border: `1px solid ${CIN.hairline}`,
              transition: 'all 0.3s',
              ...(dragOver
                ? {
                    bgcolor: 'rgba(139,124,255,0.12)',
                    color: 'var(--cin-accent, #8B7CFF)',
                    borderColor: 'rgba(139,124,255,0.4)',
                  }
                : {
                    bgcolor: 'var(--cin-surface-2, #1C1C24)',
                    color: 'var(--cin-text-muted, #9A9AA6)',
                  }),
            }}
          >
            {files.length}/{maxFiles} photos &middot; JPEG, PNG, WebP
          </Box>

          <input
            type="file"
            style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </motion.label>
      )}

      {files.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, 1fr)',
              sm: 'repeat(4, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: 1,
          }}
        >
          <AnimatePresence mode="popLayout">
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${file.size}-${i}`}
                layout
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: 'var(--cin-surface-2, #1C1C24)',
                  border: `1px solid ${CIN.hairline}`,
                }}
              >
                {/* Object URLs (blob:) must not go through PhotoTile's relative
                    /uploads resolver — render the same cinema tile treatment
                    (dark surface base + bottom vignette) directly. */}
                <Box
                  component="img"
                  src={previewUrls[i]}
                  alt={`Upload ${i + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: photoVignette,
                    pointerEvents: 'none',
                  }}
                />
                {/* Hover overlay with remove action */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s, box-shadow 0.2s',
                    '&:hover': { bgcolor: 'rgba(11,11,15,0.4)', boxShadow: `inset ${glowRing(1)}` },
                    '&:hover .remove-btn, &:focus-within .remove-btn': { opacity: 1 },
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="remove-btn"
                    aria-label={`Remove photo ${i + 1}`}
                    style={{
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,107,107,0.92)',
                      color: '#0B0B0F',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    whileHover={reduceMotion ? undefined : { scale: 1.1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                  >
                    <X style={{ height: 16, width: 16 }} />
                  </motion.button>
                </Box>
                {/* Photo number badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(11,11,15,0.65)',
                    border: `1px solid ${CIN.hairline}`,
                    fontSize: '10px',
                    color: 'var(--cin-text, #F4F4F6)',
                    fontWeight: 500,
                  }}
                >
                  {i + 1}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}
