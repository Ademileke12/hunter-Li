/**
 * NotesWidget - Rich text note-taking widget
 * 
 * Requirements:
 * - 9.1: Provide a Notes widget with rich text editing capabilities
 * - 9.5: Persist widget data to Widget_State
 * 
 * Features:
 * - Rich text editor using TipTap
 * - Support: bold, italic, lists, links
 * - Auto-save to localStorage on change (debounced 500ms)
 * - Persist per widget instance ID
 */

import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useCanvasStore } from '../stores/canvasStore';
import type { WidgetInstance } from '../types';

interface NotesWidgetProps {
  instance: WidgetInstance;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ instance }) => {
  const { updateWidget } = useCanvasStore();
  
  // Get initial content from widget state
  const initialContent = instance.state?.content || '';

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-save function with debouncing (500ms)
  const autoSave = useCallback((content: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      updateWidget(instance.id, {
        state: { ...instance.state, content },
      });
    }, 500);
  }, [instance.id, instance.state, updateWidget]);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the built-in link extension from StarterKit
        // so we can use the more feature-rich Link extension
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 hover:text-blue-300 underline cursor-pointer',
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-full p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      autoSave(html);
    },
  });

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Toolbar button component
  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, disabled, title, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-3 py-1.5 rounded transition-colors text-sm font-medium
        ${isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );

  // Link management
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    // Cancelled
    if (url === null) {
      return;
    }

    // Empty string removes link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b border-gray-700 bg-gray-800/50">
        <div className="flex flex-wrap gap-1">
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>

          <div className="w-px bg-gray-600 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <div className="w-px bg-gray-600 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            • List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            1. List
          </ToolbarButton>

          <div className="w-px bg-gray-600 mx-1" />

          {/* Link */}
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Add/Edit Link"
          >
            🔗 Link
          </ToolbarButton>

          <div className="w-px bg-gray-600 mx-1" />

          {/* Code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            {'</>'}
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            {'{ }'}
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Footer with auto-save indicator */}
      <div className="flex-shrink-0 px-3 py-1.5 border-t border-gray-700 bg-gray-800/50">
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Auto-saves after 500ms</span>
          <span className="text-gray-600">
            {editor.storage.characterCount?.characters() || 0} characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotesWidget;
