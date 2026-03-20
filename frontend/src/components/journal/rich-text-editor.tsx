'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Box, GlobalStyles } from '@mui/material';
import { sanitizeHtml } from '@/lib/utils/sanitize-html';
import { EditorToolbar } from './editor-toolbar';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
}

const proseMirrorStyles = (
  <GlobalStyles
    styles={(theme) => ({
      '.ProseMirror': {
        outline: 'none',
        minHeight: 400,
        '& > * + *': {
          marginTop: '0.75em',
        },
        '& h1': {
          fontSize: '2rem',
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: '1.5em',
        },
        '& h2': {
          fontSize: '1.5rem',
          fontWeight: 600,
          lineHeight: 1.3,
          marginTop: '1.25em',
        },
        '& h3': {
          fontSize: '1.25rem',
          fontWeight: 600,
          lineHeight: 1.4,
          marginTop: '1em',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 12,
          margin: '1em 0',
        },
        '& blockquote': {
          borderLeft: `3px solid ${theme.palette.divider}`,
          paddingLeft: '1em',
          color: theme.palette.text.secondary,
          fontStyle: 'italic',
          margin: '1em 0',
        },
        '& ul, & ol': {
          paddingLeft: '1.5em',
        },
        '& p.is-editor-empty:first-child::before': {
          content: 'attr(data-placeholder)',
          float: 'left',
          color: theme.palette.text.disabled,
          pointerEvents: 'none',
          height: 0,
        },
      },
    })}
  />
);

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  autoFocus = false,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editable,
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  return (
    <Box>
      {proseMirrorStyles}
      {editable && <EditorToolbar editor={editor} />}
      <Box sx={{ px: 0.5, pt: 2 }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}

export function getPlainTextExcerpt(html: string, maxLength = 200): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return '';
  div.innerHTML = sanitizeHtml(html);
  const text = div.textContent || div.innerText || '';
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '...' : text;
}
