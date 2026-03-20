'use client';

import { useState } from 'react';
import { Box, Typography, Drawer, Collapse } from '@mui/material';
import { Plus, X, Check, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { WIDGET_REGISTRY, WIDGET_COLORS, formatGridSize } from '@/lib/dashboard/widget-registry';
import { MOCK_ALBUMS, ALBUM_WIDGET_TYPES } from '@/lib/dashboard/mock-albums';
import type { WidgetInstance, WidgetType } from '@/lib/types/dashboard';

interface WidgetCatalogDrawerProps {
  open: boolean;
  onClose: () => void;
  widgets: WidgetInstance[];
  onAdd: (type: WidgetType, color?: string, albumId?: string) => void;
}

const ALL_TYPES = Object.values(WIDGET_REGISTRY);

export function WidgetCatalogDrawer({ open, onClose, widgets, onAdd }: WidgetCatalogDrawerProps) {
  const [expandedType, setExpandedType] = useState<WidgetType | null>(null);
  const [selectedColor, setSelectedColor] = useState(WIDGET_COLORS[0].hex);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const isAlbumType = expandedType ? ALBUM_WIDGET_TYPES.has(expandedType) : false;
  // For album widgets: step 1 = pick album, step 2 = pick color
  const showColorStep = expandedType && (!isAlbumType || selectedAlbumId !== null);

  const handleWidgetClick = (type: WidgetType) => {
    if (expandedType === type) {
      setExpandedType(null);
      setSelectedAlbumId(null);
    } else {
      setExpandedType(type);
      setSelectedColor(WIDGET_COLORS[0].hex);
      setSelectedAlbumId(null);
    }
  };

  const handleColorConfirm = (type: WidgetType, color: string) => {
    onAdd(type, color, selectedAlbumId ?? undefined);
    setExpandedType(null);
    setSelectedAlbumId(null);
    onClose();
  };

  const handleClose = () => {
    setExpandedType(null);
    setSelectedAlbumId(null);
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          maxHeight: '60vh',
          px: 3,
          py: 2.5,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Add Widget
        </Typography>
        <Box
          component="button"
          onClick={handleClose}
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'text.secondary',
          }}
        >
          <X style={{ width: 18, height: 18 }} />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5 }}>
        {ALL_TYPES.map((meta) => {
          const isExpanded = expandedType === meta.type;
          const isAlbum = ALBUM_WIDGET_TYPES.has(meta.type);

          return (
            <Box key={meta.type}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => handleWidgetClick(meta.type)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                  border: 1,
                  borderColor: isExpanded ? 'primary.main' : 'divider',
                  borderBottom: isExpanded ? '1px solid' : undefined,
                  borderBottomColor: isExpanded ? 'divider' : undefined,
                  bgcolor: isExpanded ? 'action.selected' : 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isExpanded ? 'action.selected' : 'action.hover' },
                  transition: 'background-color 0.2s, border-color 0.2s',
                  textAlign: 'left',
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Plus style={{ width: 16, height: 16, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {meta.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatGridSize(meta.gridSize.cols, meta.gridSize.rows)}
                    {meta.allowedSizes.length > 1 ? ` · ${meta.allowedSizes.length} sizes` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Expansion panel */}
              <Collapse in={isExpanded}>
                <Box
                  sx={{
                    border: 1,
                    borderTop: 0,
                    borderColor: 'primary.main',
                    borderRadius: '0 0 12px 12px',
                    p: 1.5,
                    bgcolor: 'background.paper',
                  }}
                >
                  {/* Album picker step (album-type widgets only) */}
                  {isAlbum && !selectedAlbumId && (
                    <>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                        Choose an album
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: 1,
                          maxHeight: 200,
                          overflowY: 'auto',
                        }}
                      >
                        {MOCK_ALBUMS.map((album) => (
                          <Box
                            key={album.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlbumId(album.id);
                            }}
                            sx={{
                              cursor: 'pointer',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              position: 'relative',
                              aspectRatio: '1',
                              '&:hover': { opacity: 0.85, transform: 'scale(1.03)' },
                              transition: 'opacity 0.2s, transform 0.2s',
                            }}
                          >
                            <Image src={album.cover} alt={album.title} fill style={{ objectFit: 'cover' }} />
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 0.5,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                              }}
                            >
                              <Typography sx={{ fontSize: '9px', fontWeight: 600, color: 'white', lineHeight: 1.2, textAlign: 'center' }}>
                                {album.title}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Back button + color picker step */}
                  {showColorStep && (
                    <>
                      {isAlbum && selectedAlbumId && (
                        <Box
                          component="button"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedAlbumId(null);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 1,
                            border: 'none',
                            bgcolor: 'transparent',
                            cursor: 'pointer',
                            color: 'text.secondary',
                            p: 0,
                            '&:hover': { color: 'text.primary' },
                            transition: 'color 0.15s',
                          }}
                        >
                          <ChevronLeft style={{ width: 14, height: 14 }} />
                          <Typography variant="caption">
                            {MOCK_ALBUMS.find((a) => a.id === selectedAlbumId)?.title}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                        Choose a color
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {WIDGET_COLORS.map((wc) => (
                          <Box
                            key={wc.hex}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColorConfirm(meta.type, wc.hex);
                            }}
                            onMouseEnter={() => setSelectedColor(wc.hex)}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: wc.hex,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: selectedColor === wc.hex ? '2px solid' : '2px solid transparent',
                              borderColor: selectedColor === wc.hex ? 'text.primary' : 'transparent',
                              transition: 'border-color 0.15s, transform 0.15s',
                              '&:hover': { transform: 'scale(1.15)' },
                            }}
                          >
                            {selectedColor === wc.hex && (
                              <Check style={{ width: 14, height: 14, color: 'white' }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
}
