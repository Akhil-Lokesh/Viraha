'use client';

import { useState } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Plus, ScrollText, Trash2, Loader2, RotateCcw, X } from 'lucide-react';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDrawer from '@mui/material/Drawer';
import MenuItem from '@mui/material/MenuItem';
import {
  useScrapbooks,
  useScrapbook,
  useCreateScrapbook,
  useDeleteScrapbook,
  useAddScrapbookItem,
  useRemoveScrapbookItem,
} from '@/lib/hooks/use-scrapbooks';
import type { Scrapbook, ScrapbookItemType } from '@/lib/api/scrapbooks';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // Backend envelope: { success: false, error: { code, message } }
    const serverMessage = error.response?.data?.error?.message;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return serverMessage;
    }
  }
  return fallback;
}

// Link items are stored content rendered as anchor hrefs. Only http(s) URLs are
// safe to use as an href; javascript:/data:/other schemes must never be linked
// (stored XSS), so callers fall back to plain text when this returns false.
function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const ITEM_TYPE_OPTIONS: { value: ScrapbookItemType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'saved_post', label: 'Saved Post' },
  { value: 'place_pin', label: 'Place Pin' },
];

function itemTypeLabel(type: ScrapbookItemType): string {
  return ITEM_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export default function ScrapbooksPage() {
  const { data: scrapbooks, isLoading, isError, refetch, isFetching } = useScrapbooks();
  const createScrapbook = useCreateScrapbook();
  const deleteScrapbook = useDeleteScrapbook();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const list = scrapbooks ?? [];

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setCreateError('Please enter a title.');
      return;
    }
    setCreateError(null);
    try {
      const created = await createScrapbook.mutateAsync({
        title: trimmed,
        description: description.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setCreateOpen(false);
      setOpenId(created.id);
    } catch (error: unknown) {
      setCreateError(getErrorMessage(error, 'Could not create scrapbook. Please try again.'));
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setListError(null);
    try {
      await deleteScrapbook.mutateAsync(id);
      if (openId === id) setOpenId(null);
    } catch (error: unknown) {
      setListError(getErrorMessage(error, 'Could not delete scrapbook. Please try again.'));
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box
        component={motion.div}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Scrapbooks
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                mt: 1,
                maxWidth: 380,
                lineHeight: 1.5,
              }}
            >
              Free-form collections of notes, links, and memories.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            disableElevation
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            sx={{
              borderRadius: '12px',
              flexShrink: 0,
              px: 2.5,
              py: 1.25,
              fontSize: '0.85rem',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
            Create
          </Button>
        </Box>
      </Box>

      {listError && (
        <Box sx={{ mb: 2 }}>
          <Typography role="alert" variant="body2" sx={{ color: 'error.main', fontSize: '0.8125rem' }}>
            {listError}
          </Typography>
        </Box>
      )}

      {/* Content */}
      {isLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 2.5,
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <Skeleton
                variant="rounded"
                animation="pulse"
                sx={{ aspectRatio: '4/3', borderRadius: '16px', width: '100%' }}
              />
            </Box>
          ))}
        </Box>
      ) : isError ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 10,
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>Could not load your scrapbooks</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
            Something went wrong while fetching your scrapbooks. Please try again.
          </Typography>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{ borderRadius: '9999px', px: 3, mt: 1 }}
          >
            <RotateCcw style={{ width: 16, height: 16, marginRight: 6 }} />
            {isFetching ? 'Retrying...' : 'Retry'}
          </Button>
        </Box>
      ) : list.length === 0 ? (
        <Box
          component={motion.div}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 10,
            gap: 1.5,
          }}
        >
          <ScrollText style={{ width: 44, height: 44, color: 'var(--mui-palette-text-secondary)' }} />
          <Typography sx={{ fontWeight: 600 }}>No scrapbooks yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
            Create your first scrapbook to start collecting notes, links, and memories.
          </Typography>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            sx={{ borderRadius: '9999px', px: 3, mt: 1 }}
          >
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
            Create Scrapbook
          </Button>
        </Box>
      ) : (
        <Box
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 2.5,
          }}
        >
          {list.map((scrapbook) => (
            <ScrapbookCard
              key={scrapbook.id}
              scrapbook={scrapbook}
              onOpen={() => setOpenId(scrapbook.id)}
              onDelete={() => handleDelete(scrapbook.id)}
              isDeleting={pendingDeleteId === scrapbook.id}
            />
          ))}
        </Box>
      )}

      {/* Create dialog */}
      <MuiDialog
        open={createOpen}
        onClose={() => (createScrapbook.isPending ? undefined : setCreateOpen(false))}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <MuiDialogContent sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            New Scrapbook
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Give your scrapbook a title to get started.
          </Typography>

          {createError && (
            <Typography role="alert" variant="body2" sx={{ color: 'error.main', fontSize: '0.8125rem', mb: 1.5 }}>
              {createError}
            </Typography>
          )}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 200 }}
            sx={{ mb: 2 }}
            autoFocus
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            inputProps={{ maxLength: 2000 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button
              onClick={() => setCreateOpen(false)}
              disabled={createScrapbook.isPending}
              sx={{ borderRadius: '9999px', px: 2.5, color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleCreate}
              disabled={createScrapbook.isPending}
              sx={{ borderRadius: '9999px', px: 3 }}
            >
              {createScrapbook.isPending ? (
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              ) : (
                'Create'
              )}
            </Button>
          </Box>
        </MuiDialogContent>
      </MuiDialog>

      {/* Detail drawer */}
      <ScrapbookDetailDrawer
        scrapbookId={openId}
        onClose={() => setOpenId(null)}
      />
    </Box>
  );
}

interface ScrapbookCardProps {
  scrapbook: Scrapbook;
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ScrapbookCard({ scrapbook, onOpen, onDelete, isDeleting }: ScrapbookCardProps) {
  const itemCount = scrapbook._count?.items ?? scrapbook.items?.length ?? 0;

  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      sx={{
        position: 'relative',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onOpen}
        sx={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          border: 'none',
          bgcolor: 'transparent',
          cursor: 'pointer',
          p: 0,
        }}
      >
        <Box
          sx={{
            aspectRatio: '4/3',
            bgcolor: 'action.hover',
            backgroundImage: scrapbook.coverImage ? `url(${scrapbook.coverImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!scrapbook.coverImage && (
            <ScrollText style={{ width: 36, height: 36, color: 'var(--mui-palette-text-secondary)', opacity: 0.5 }} />
          )}
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {scrapbook.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.25 }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Typography>
        </Box>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label={`Delete ${scrapbook.title}`}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          bgcolor: 'rgba(0,0,0,0.45)',
          color: 'white',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
          '&:disabled': { opacity: 0.5, cursor: 'default' },
        }}
      >
        {isDeleting ? (
          <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
        ) : (
          <Trash2 style={{ width: 16, height: 16 }} />
        )}
      </Box>
    </Box>
  );
}

interface ScrapbookDetailDrawerProps {
  scrapbookId: string | null;
  onClose: () => void;
}

function ScrapbookDetailDrawer({ scrapbookId, onClose }: ScrapbookDetailDrawerProps) {
  const open = !!scrapbookId;
  const { data: scrapbook, isLoading, isError, refetch, isFetching } = useScrapbook(scrapbookId ?? '');
  const addItem = useAddScrapbookItem();
  const removeItem = useRemoveScrapbookItem();

  const [itemType, setItemType] = useState<ScrapbookItemType>('note');
  const [content, setContent] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!scrapbookId) return;
    const trimmed = content.trim();
    if (!trimmed) {
      setAddError(itemType === 'link' ? 'Please enter a URL.' : 'Please enter some content.');
      return;
    }
    setAddError(null);
    try {
      await addItem.mutateAsync({ scrapbookId, input: { itemType, content: trimmed } });
      setContent('');
    } catch (error: unknown) {
      setAddError(getErrorMessage(error, 'Could not add item. Please try again.'));
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!scrapbookId) return;
    setPendingRemoveId(itemId);
    setRemoveError(null);
    try {
      await removeItem.mutateAsync({ itemId, scrapbookId });
    } catch (error: unknown) {
      setRemoveError(getErrorMessage(error, 'Could not remove item. Please try again.'));
    } finally {
      setPendingRemoveId(null);
    }
  };

  const items = scrapbook?.items ?? [];

  return (
    <MuiDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 420 },
            borderTopLeftRadius: { xs: 0, sm: 24 },
            borderBottomLeftRadius: { xs: 0, sm: 24 },
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            p: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {scrapbook?.title ?? 'Scrapbook'}
            </Typography>
            {scrapbook?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {scrapbook.description}
              </Typography>
            )}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={onClose}
            aria-label="Close"
            sx={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              bgcolor: 'action.hover',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : isError ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Could not load scrapbook</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please try again.
              </Typography>
              <Button
                variant="outlined"
                disableElevation
                onClick={() => refetch()}
                disabled={isFetching}
                sx={{ borderRadius: '9999px', px: 3 }}
              >
                <RotateCcw style={{ width: 16, height: 16, marginRight: 6 }} />
                {isFetching ? 'Retrying...' : 'Retry'}
              </Button>
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ScrollText style={{ width: 36, height: 36, color: 'var(--mui-palette-text-secondary)', opacity: 0.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No items yet. Add your first one below.
              </Typography>
            </Box>
          ) : (
            <>
              {removeError && (
                <Typography role="alert" variant="body2" sx={{ color: 'error.main', fontSize: '0.8125rem', mb: 1.5 }}>
                  {removeError}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'text.secondary',
                          mb: 0.25,
                        }}
                      >
                        {itemTypeLabel(item.itemType)}
                      </Typography>
                      {item.itemType === 'link' && item.content && isSafeHttpUrl(item.content) ? (
                        <Typography
                          component="a"
                          href={item.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: '0.875rem',
                            color: 'primary.main',
                            wordBreak: 'break-all',
                            textDecoration: 'underline',
                          }}
                        >
                          {item.content}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.875rem', color: 'text.primary', wordBreak: 'break-word' }}>
                          {item.content ?? item.referenceId ?? '—'}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={pendingRemoveId === item.id}
                      aria-label="Remove item"
                      sx={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: 'none',
                        bgcolor: 'transparent',
                        color: 'text.secondary',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': { bgcolor: 'action.hover', color: 'error.main' },
                        '&:disabled': { opacity: 0.5, cursor: 'default' },
                      }}
                    >
                      {pendingRemoveId === item.id ? (
                        <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 style={{ width: 15, height: 15 }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* Add-item footer */}
        {!isLoading && !isError && (
          <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            {addError && (
              <Typography role="alert" variant="body2" sx={{ color: 'error.main', fontSize: '0.8125rem', mb: 1 }}>
                {addError}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                select
                label="Type"
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ScrapbookItemType)}
                size="small"
                sx={{ width: 140, flexShrink: 0 }}
              >
                {ITEM_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={itemType === 'link' ? 'URL' : 'Content'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                size="small"
                fullWidth
                inputProps={{ maxLength: 2000 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
            </Box>
            <Button
              variant="contained"
              disableElevation
              fullWidth
              onClick={handleAdd}
              disabled={addItem.isPending}
              sx={{ borderRadius: '9999px' }}
            >
              {addItem.isPending ? (
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
                  Add Item
                </>
              )}
            </Button>
          </Box>
        )}
      </Box>
    </MuiDrawer>
  );
}
