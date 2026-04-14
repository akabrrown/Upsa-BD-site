'use client'

import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { FontSize } from './extensions/FontSize'
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, AlignLeft, AlignCenter,
    AlignRight, Link as LinkIcon, Image as ImageIcon,
    ChevronDown, Sparkles, Variable, Type, Paperclip, FileText, X as XIcon, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    onAiClick?: () => void;
    attachments?: any[];
    onAttachmentsChange?: (attachments: any[]) => void;
}

const Editor = ({ 
    value, 
    onChange, 
    onAiClick, 
    attachments = [], 
    onAttachmentsChange
}: EditorProps) => {
    const [uploadingFile, setUploadingFile] = React.useState(false)

    const extensions = React.useMemo(() => [
        StarterKit,
        TextStyle,
        FontFamily,
        FontSize,
        Image.configure({
            allowBase64: true,
        }),
        Placeholder.configure({
            placeholder: 'Write your birthday wish here...',
        }),
        TextAlign.configure({
            types: ['heading', 'paragraph', 'image'],
        }),
    ], [])

    const editor = useEditor({
        extensions,
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Sync content when value prop changes externally (e.g. AI generation)
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value)
        }
    }, [editor, value])

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addImage = useCallback(() => {
        if (!editor) return
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const formData = new FormData()
                formData.append('file', file)
                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    })
                    const data = await res.json()
                    if (data.url) {
                        editor.chain().focus().setImage({ src: data.url }).run()
                    } else {
                        alert(data.error || 'Upload failed')
                    }
                } catch (error) {
                    alert('Upload failed')
                }
            }
        }
        input.click()
    }, [editor])

    const insertVariable = (variable: string) => {
        if (!editor) return
        editor.chain().focus().insertContent(`[${variable}]`).run()
    }

    const handleFileUpload = useCallback(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files
            if (!files) return

            setUploadingFile(true)
            const newAttachments = [...attachments]

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)

                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    })
                    const data = await res.json()
                    if (data.url) {
                        newAttachments.push({
                            name: file.name,
                            url: data.url,
                            size: file.size
                        })
                    }
                } catch (error) {
                    console.error('File upload failed:', error)
                }
            }

            onAttachmentsChange?.(newAttachments)
            setUploadingFile(false)
        }
        input.click()
    }, [attachments, onAttachmentsChange])

    const removeAttachment = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index)
        onAttachmentsChange?.(newAttachments)
    }

    if (!editor) {
        return <div className="h-40 bg-gray-50 animate-pulse rounded-xl border border-gray-100" />
    }

    const variables = [
        { name: 'Full Name', tag: 'Name' },
        { name: 'Surname', tag: 'Surname' },
        { name: 'Other Names', tag: 'OtherNames' },
        { name: 'Role', tag: 'Role' },
        { name: 'Rank', tag: 'Rank' },
    ]

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-[#003087] transition-colors">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-0.5 mr-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('bold') ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('italic') ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('underline') ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <div className="flex items-center gap-0.5 mr-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('bulletList') ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('orderedList') ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <div className="flex items-center gap-0.5 mr-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive({ textAlign: 'left' }) ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive({ textAlign: 'center' }) ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive({ textAlign: 'right' }) ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <div className="flex items-center gap-2 mr-2">
                    <Select
                        value={editor.getAttributes('textStyle').fontFamily || 'sans-serif'}
                        onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
                    >
                        <SelectTrigger className="h-8 w-[120px] text-xs bg-transparent border-transparent hover:bg-white shadow-none focus:ring-0">
                            <SelectValue placeholder="Font" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="sans-serif">Default</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={editor.getAttributes('fontSize').fontSize || '16px'}
                        onValueChange={(value) => editor.chain().focus().setFontSize(value).run()}
                    >
                        <SelectTrigger className="h-8 w-[80px] text-xs bg-transparent border-transparent hover:bg-white shadow-none focus:ring-0">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="12px">12px</SelectItem>
                            <SelectItem value="14px">14px</SelectItem>
                            <SelectItem value="16px">16px</SelectItem>
                            <SelectItem value="18px">18px</SelectItem>
                            <SelectItem value="20px">20px</SelectItem>
                            <SelectItem value="24px">24px</SelectItem>
                            <SelectItem value="28px">28px</SelectItem>
                            <SelectItem value="32px">32px</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <div className="flex items-center gap-0.5 mr-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={setLink}
                        className={`h-8 w-8 p-0 rounded-lg ${editor.isActive('link') ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'}`}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={addImage}
                        className="h-8 w-8 p-0 rounded-lg text-gray-500"
                        title="Insert Image"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost" size="sm"
                        onClick={handleFileUpload}
                        className={`h-8 w-8 p-0 rounded-lg ${uploadingFile ? 'text-blue-500' : 'text-gray-500'}`}
                        title="Attach Files"
                    >
                        {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="h-4 w-px bg-gray-200 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-gray-500 font-bold text-xs">
                            <Variable className="h-3 w-3 mr-1.5" />
                            Variables
                            <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-xl border-gray-100 shadow-xl">
                        {variables.map(v => (
                            <DropdownMenuItem
                                key={v.tag}
                                onClick={() => insertVariable(v.tag)}
                                className="font-medium text-sm px-3 py-2 cursor-pointer hover:bg-gray-50"
                            >
                                {v.name}
                                <span className="ml-auto text-[10px] text-gray-400 font-mono">[{v.tag}]</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1" />

                <Button
                    variant="ghost" size="sm"
                    onClick={onAiClick}
                    className="h-8 px-2 rounded-lg text-purple-600 font-bold text-xs hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Write with AI
                </Button>
            </div>

            {/* Editor Surface */}
            <div className="p-4 min-h-[250px] prose prose-sm max-w-none focus:outline-none tiptap-wrapper">
                <EditorContent editor={editor} />
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 shadow-sm hover:border-gray-300 transition-colors">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button
                                onClick={() => removeAttachment(idx)}
                                className="hover:text-red-500 transition-colors ml-1"
                            >
                                <XIcon className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .tiptap:focus {
                    outline: none;
                }
                .tiptap p {
                    font-size: 16px;
                }
                .tiptap-wrapper * {
                    font-family: inherit;
                }
                .tiptap img {
                    display: block;
                    max-width: 100%;
                    height: auto;
                    border-radius: 12px;
                    margin: 12px 0;
                }
                .tiptap img[style*="text-align: left"] { margin-left: 0; margin-right: auto; }
                .tiptap img[style*="text-align: center"] { margin-left: auto; margin-right: auto; }
                .tiptap img[style*="text-align: right"] { margin-left: auto; margin-right: 0; }
                .tiptap ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                }
                .tiptap ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                }
            `}</style>
        </div>
    )
}

export default Editor
