'use client';

import { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { Box, Typography } from '@mui/material';

interface PhotoUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function PhotoUpload({ files, onChange, maxFiles = 10 }: PhotoUploadProps) {
  const [dragOver, setDragOver] = useState(false);

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

  // Memoize object URLs to prevent re-creation on every render
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

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
            border: '2px dashed',
            borderRadius: 16,
            cursor: 'pointer',
            transition: 'all 0.3s',
            borderColor: dragOver
              ? 'var(--mui-palette-primary-main)'
              : 'rgba(var(--mui-palette-text-secondaryChannel) / 0.2)',
            backgroundColor: dragOver
              ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.05)'
              : 'transparent',
            transform: dragOver ? 'scale(1.01)' : 'scale(1)',
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
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <motion.div
            animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              <Camera
                style={{
                  height: 40,
                  width: 40,
                  marginBottom: 12,
                  transition: 'color 0.3s',
                  color: dragOver
                    ? 'var(--mui-palette-primary-main)'
                    : 'rgba(var(--mui-palette-text-secondaryChannel) / 0.5)',
                }}
              />
            </motion.div>
          </motion.div>

          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.3s',
              color: dragOver ? 'primary.main' : 'text.secondary',
            }}
          >
            Drop your travel photos here
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.disabled',
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
              transition: 'all 0.3s',
              ...(dragOver
                ? {
                    bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
                    color: 'primary.main',
                  }
                : {
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: 'var(--mui-palette-action-hover)',
                }}
              >
                <Box
                  component="img"
                  src={previewUrls[i]}
                  alt={`Upload ${i + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                />
                {/* Hover overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' },
                    '&:hover .remove-btn': { opacity: 1 },
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="remove-btn"
                    style={{
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239,68,68,0.9)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
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
                    bgcolor: 'rgba(0,0,0,0.5)',
                    fontSize: '10px',
                    color: '#fff',
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
