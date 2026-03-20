'use client';

import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Box, IconButton, Divider } from '@mui/material';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { uploadPhotos } from '@/lib/api/media';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const result = await uploadPhotos(Array.from(files));
      result.urls.forEach((url) => {
        editor.chain().focus().setImage({ src: url }).run();
      });
    } catch {
      // Upload failed silently — user can retry
    }

    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const btnSx = (isActive: boolean) => ({
    width: 34,
    height: 34,
    borderRadius: '8px',
    color: isActive ? 'secondary.main' : 'text.secondary',
    bgcolor: isActive ? 'action.selected' : 'transparent',
    '&:hover': { bgcolor: 'action.hover' },
  });

  const iconSize = { width: 18, height: 18 };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        flexWrap: 'wrap',
        py: 1,
        px: 0.5,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* Text formatting */}
      <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} sx={btnSx(editor.isActive('bold'))}>
        <Bold style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} sx={btnSx(editor.isActive('italic'))}>
        <Italic style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} sx={btnSx(editor.isActive('underline'))}>
        <Underline style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().toggleStrike().run()} sx={btnSx(editor.isActive('strike'))}>
        <Strikethrough style={iconSize} />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Headings */}
      <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} sx={btnSx(editor.isActive('heading', { level: 1 }))}>
        <Heading1 style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} sx={btnSx(editor.isActive('heading', { level: 2 }))}>
        <Heading2 style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} sx={btnSx(editor.isActive('heading', { level: 3 }))}>
        <Heading3 style={iconSize} />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Lists */}
      <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} sx={btnSx(editor.isActive('bulletList'))}>
        <List style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} sx={btnSx(editor.isActive('orderedList'))}>
        <ListOrdered style={iconSize} />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Image */}
      <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={btnSx(false)}>
        <ImageIcon style={iconSize} />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Undo / Redo */}
      <IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} sx={btnSx(false)}>
        <Undo style={iconSize} />
      </IconButton>
      <IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} sx={btnSx(false)}>
        <Redo style={iconSize} />
      </IconButton>
    </Box>
  );
}
