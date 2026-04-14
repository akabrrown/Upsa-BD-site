'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Edit3, Eye, Plus, Trash, Sparkles, X, Paperclip, Check } from 'lucide-react'
import Editor from '@/components/Editor'

interface TemplateForm {
    name: string;
    subject: string;
    body: string;
    attachments: any[];
    fontStyle: string;
    fontSize: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [createDialog, setCreateDialog] = useState(false)
    const [editTemplate, setEditTemplate] = useState<any | null>(null)
    const [form, setForm] = useState<TemplateForm>({ name: '', subject: '', body: '', attachments: [], fontStyle: 'Arial', fontSize: '16px' })
    const [saving, setSaving] = useState(false)
    const [previewTemplate, setPreviewTemplate] = useState<any | null>(null)
    const [isAiGenerating, setIsAiGenerating] = useState(false)

    const fetchTemplates = () => {
        fetch('/api/templates')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTemplates(data)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    const handleCreate = async () => {
        if (!form.name || !form.subject || !form.body) {
            alert('Please fill in all fields')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                setCreateDialog(false)
                setForm({ name: '', subject: '', body: '', attachments: [], fontStyle: 'Arial', fontSize: '16px' })
                fetchTemplates()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to create template')
            }
        } catch {
            alert('Failed to create template')
        }
        setSaving(false)
    }

    const handleUpdate = async () => {
        if (!editTemplate) return
        setSaving(true)
        try {
            const res = await fetch(`/api/templates/${editTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                setEditTemplate(null)
                setForm({ name: '', subject: '', body: '', attachments: [], fontStyle: 'Arial', fontSize: '16px' })
                fetchTemplates()
            } else {
                const err = await res.json()
                alert(err.error || 'Failed to update template')
            }
        } catch {
            alert('Failed to update template')
        }
        setSaving(false)
    }

    const handleToggleActive = async (template: any) => {
        try {
            const res = await fetch(`/api/templates/${template.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !template.isActive }),
            })
            if (res.ok) {
                fetchTemplates()
            }
        } catch {
            alert('Failed to update template status')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return
        await fetch(`/api/templates/${id}`, { method: 'DELETE' })
        fetchTemplates()
    }

    const openEdit = (template: any) => {
        setForm({
            name: template.name,
            subject: template.subject,
            body: template.body,
            attachments: template.attachments || [],
            fontStyle: template.fontStyle || 'Arial',
            fontSize: template.fontSize || '16px'
        })
        setEditTemplate(template)
    }

    const handleAiGenerate = async () => {
        setIsAiGenerating(true)
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Generate a professional birthday wish for UPSA personnel.' })
            })
            const data = await res.json()
            if (data.text) {
                // Insert AI text into the body (appending to current content)
                const formattedAiText = data.text.replace(/\n/g, '<br/>')
                setForm((prev: TemplateForm) => ({
                    ...prev,
                    body: prev.body + (prev.body ? '<br/><br/>' : '') + formattedAiText
                }))
            }
        } catch (error) {
            alert('AI Generation failed')
        }
        setIsAiGenerating(false)
    }

    const renderPreviewBody = (html: string, fontStyle?: string, fontSize?: string) => {
        let content = html
            .replace(/\[Name\]/g, '<span class="text-[#003087] font-bold underline decoration-[#FFD700]/30 underline-offset-4">John Doe</span>')
            .replace(/\[Surname\]/g, '<span class="text-[#003087] font-bold">Doe</span>')
            .replace(/\[OtherNames\]/g, '<span class="text-[#003087] font-bold">John</span>')
            .replace(/\[Role\]/g, '<span class="text-[#003087] font-bold italic">Student</span>')
            .replace(/\[Rank\]/g, '<span class="text-[#003087] font-semibold">Level 400</span>')

        const style = fontStyle && fontSize ? `font-family: '${fontStyle}'; font-size: ${fontSize};` : fontStyle ? `font-family: '${fontStyle}';` : fontSize ? `font-size: ${fontSize};` : '';

        return <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed custom-preview" style={style ? { fontFamily: fontStyle, fontSize: fontSize } : undefined} dangerouslySetInnerHTML={{ __html: content }} />
    }

    return (
        <div className="min-h-screen bg-gray-50/30">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#003087] tracking-tight">Email Templates</h1>
                        <p className="text-sm sm:text-base text-gray-500 font-medium mt-2 max-w-xl">
                            Compose, customize, and automate your birthday wishes. Use rich formatting and AI to create messages that stand out.
                        </p>
                    </div>

                    <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#003087] text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-[#003087]/20 hover:bg-[#002060] transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]">
                                <Plus className="w-5 h-5 mr-3" />
                                Create New Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:max-w-[900px] rounded-[2.5rem] p-6 sm:p-10 max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
                            <DialogHeader className="text-left mb-8">
                                <DialogTitle className="text-2xl sm:text-3xl font-black text-[#003087]">Craft Your Message</DialogTitle>
                                <DialogDescription className="text-gray-500 font-medium mt-1">
                                    Express your wishes with style. Attach images, format text, and insert smart variables.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-8 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="font-black text-[#003087] text-sm uppercase tracking-wider ml-1">Template Name</Label>
                                        <Input
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g. Staff Anniversary Special"
                                            className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-[#003087] text-sm uppercase tracking-wider ml-1">Email Subject</Label>
                                        <Input
                                            value={form.subject}
                                            onChange={e => setForm({ ...form, subject: e.target.value })}
                                            placeholder="e.g. A Special Surprise Awaits! 🎂"
                                            className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>



                                <div className="space-y-2">
                                    <Label className="font-black text-[#003087] text-sm uppercase tracking-wider ml-1 block mb-3">Message Content</Label>
                                    <div className="relative group">
                                        <Editor
                                            value={form.body}
                                            onChange={(val) => setForm({ ...form, body: val })}
                                            onAiClick={handleAiGenerate}
                                            attachments={form.attachments}
                                            onAttachmentsChange={(files) => setForm({ ...form, attachments: files })}
                                        />
                                        {isAiGenerating && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-20">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="bg-[#003087] p-3 rounded-2xl shadow-xl animate-bounce">
                                                        <Sparkles className="w-6 h-6 text-[#FFD700]" />
                                                    </div>
                                                    <p className="text-[#003087] font-black text-sm tracking-widest uppercase animate-pulse">AI is writing...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreate}
                                    disabled={saving}
                                    className="w-full h-14 rounded-2xl font-black bg-[#003087] hover:bg-[#002060] text-white shadow-2xl shadow-[#003087]/30 transition-all text-lg tracking-wide group"
                                >
                                    {saving ? 'Finalizing...' : (
                                        <>
                                            Save Template
                                            <div className="ml-2 w-5 h-5 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                <Plus className="w-3 h-3" />
                                            </div>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edit Dialog */}
                <Dialog open={!!editTemplate} onOpenChange={(open) => { if (!open) setEditTemplate(null) }}>
                    <DialogContent className="w-[95vw] sm:max-w-[900px] rounded-[2.5rem] p-6 sm:p-10 max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
                        <DialogHeader className="text-left mb-8">
                            <DialogTitle className="text-2xl sm:text-3xl font-black text-[#003087]">Refine Template</DialogTitle>
                            <DialogDescription className="text-gray-500 font-medium mt-1">
                                Adjust the template details, font styles, and message content.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-8 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-[#003087] text-sm uppercase tracking-wider ml-1">Template Name</Label>
                                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-black text-[#003087] text-sm uppercase tracking-wider ml-1">Email Subject</Label>
                                    <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all" />
                                </div>
                            </div>



                            <div className="space-y-2">
                                <Label className="font-black text-[#003087] text-sm uppercase tracking-wider ml-1 block mb-3">Message Content</Label>
                                <div className="relative group">
                                    <Editor
                                        value={form.body}
                                        onChange={(val) => setForm({ ...form, body: val })}
                                        onAiClick={handleAiGenerate}
                                        attachments={form.attachments}
                                        onAttachmentsChange={(files) => setForm({ ...form, attachments: files })}
                                    />
                                    {isAiGenerating && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-[#003087] p-3 rounded-2xl shadow-xl animate-bounce">
                                                    <Sparkles className="w-6 h-6 text-[#FFD700]" />
                                                </div>
                                                <p className="text-[#003087] font-black text-sm tracking-widest uppercase animate-pulse">AI is writing...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleUpdate} disabled={saving} className="w-full h-14 rounded-2xl font-black bg-[#003087] hover:bg-[#002060] text-white shadow-2xl shadow-[#003087]/30 transition-all text-lg tracking-wide group">
                                {saving ? 'Applying Changes...' : 'Save Template Changes'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Preview Dialog */}
                <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null) }}>
                    <DialogContent className="w-[95vw] sm:max-w-[650px] rounded-[3rem] p-0 overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,48,135,0.3)] border-0">
                        <DialogTitle className="sr-only">Template Preview</DialogTitle>
                        <DialogDescription className="sr-only">Live render of the email template.</DialogDescription>
                        <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full bg-red-400/80 shadow-sm" />
                                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80 shadow-sm" />
                                    <div className="w-3.5 h-3.5 rounded-full bg-green-400/80 shadow-sm" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-2">Email Live Render</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)} className="rounded-full w-8 h-8 p-0 hover:bg-gray-200">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        {previewTemplate && (
                            <div className="bg-white">
                                <div className="p-8 border-b border-gray-50 bg-gray-50/20">
                                    <div className="flex items-start gap-4 mb-3">
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest w-16 pt-1">Subject</div>
                                        <div className="text-base text-gray-900 font-bold leading-snug">{previewTemplate.subject}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest w-16">Sender</div>
                                        <div className="text-sm text-gray-900 font-semibold flex items-center">
                                            <div className="w-5 h-5 rounded-md bg-[#003087]/10 flex items-center justify-center mr-2">
                                                <Mail className="w-3 h-3 text-[#003087]" />
                                            </div>
                                            UPSA Birthday Wishes
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#003087] p-12 text-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-2xl group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFD700]/10 rounded-full -ml-16 -mb-16 blur-2xl" />
                                    <div className="text-[#FFD700] text-3xl font-black relative z-10 transition-all duration-500 hover:tracking-wider">UPSA</div>
                                    <div className="text-white/70 font-black uppercase tracking-[0.3em] mt-1 text-[10px] relative z-10">Celebrating You</div>
                                    <div className="mt-8 relative z-10">
                                        <div className="inline-flex flex-col items-center">
                                            <div className="h-px w-8 bg-[#FFD700]/40 mb-3" />
                                            <div className="text-white font-bold text-sm">{previewTemplate.name}</div>
                                            <div className="h-px w-8 bg-[#FFD700]/40 mt-3" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-12 sm:p-16 bg-white min-h-[300px]">
                                    <style jsx global>{`
                                        .custom-preview img {
                                            display: block;
                                            max-width: 100%;
                                            height: auto;
                                            border-radius: 2rem;
                                            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
                                            margin: 2rem 0;
                                        }
                                        .custom-preview img[style*="text-align: left"] { margin-left: 0; margin-right: auto; }
                                        .custom-preview img[style*="text-align: center"] { margin-left: auto; margin-right: auto; }
                                        .custom-preview img[style*="text-align: right"] { margin-left: auto; margin-right: 0; }
                                        .custom-preview ul, .custom-preview ol {
                                            margin: 1.5rem 0;
                                            padding-left: 1.5rem;
                                        }
                                        .custom-preview li {
                                            margin-bottom: 0.5rem;
                                        }
                                    `}</style>
                                    {renderPreviewBody(previewTemplate.body, previewTemplate.fontStyle, previewTemplate.fontSize)}
                                </div>
                                <div className="bg-[#003087] py-8 px-10 border-t border-white/5 flex flex-col items-center">
                                    <div className="flex gap-6 mb-6">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center" />)}
                                    </div>
                                    <div className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mb-2">UPSA GHANA</div>
                                    <div className="text-white/20 text-[8px] font-medium max-w-xs text-center leading-relaxed">
                                        UNIVERSITY OF PROFESSIONAL STUDIES, ACCRA. ALL RIGHTS RESERVED. AUTOMATED BY BIRTHDAY PORTAL.
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-80 bg-white rounded-[3rem] border border-gray-100 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[4rem] border border-gray-100 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#003087]/[0.02] to-transparent" />
                        <div className="bg-[#003087] w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#003087]/30 group-hover:rotate-12 transition-transform duration-500 relative z-10">
                            <Mail className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-[#003087] text-3xl font-black relative z-10 tracking-tight">Your Template Library is Empty</div>
                        <p className="text-gray-400 font-medium mt-4 max-w-sm mx-auto relative z-10 leading-relaxed">
                            Start creating stunning, personalized birthday experiences for your lecturers and students.
                        </p>
                        <Button
                            onClick={() => setCreateDialog(true)}
                            className="mt-10 bg-[#003087] text-white font-black h-14 px-10 rounded-2xl shadow-xl hover:bg-[#002060] transition-all relative z-10 scale-100 hover:scale-105"
                        >
                            Get Started Now
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {templates.map((template: any) => (
                            <Card key={template.id} className={`border-0 shadow-xl transition-all duration-700 rounded-[3.5rem] overflow-hidden bg-white group flex flex-col relative ${template.isActive ? 'ring-4 ring-[#003087] shadow-[0_45px_100px_-20px_rgba(0,48,135,0.25)]' : 'hover:shadow-[0_45px_100px_-20px_rgba(0,48,135,0.15)]'}`}>
                                {template.isActive && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#003087] text-[#FFD700] px-8 py-2 rounded-b-3xl font-black text-[10px] tracking-[0.3em] uppercase shadow-lg z-20">
                                        Live for Birthdays
                                    </div>
                                )}
                                <CardHeader className={`${template.isActive ? 'bg-[#003087]/[0.02]' : 'bg-gray-50/50'} border-b border-gray-50 pb-6 pt-12 px-10 relative overflow-hidden shrink-0`}>
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 -mr-4 -mt-4">
                                        <Sparkles className="w-24 h-24 text-[#003087]" />
                                    </div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-4 rounded-3xl shadow-xl shadow-black/[0.03] group-hover:scale-110 transition-transform duration-500 ${template.isActive ? 'bg-[#003087] text-white' : 'bg-white text-[#003087]'}`}>
                                                <Mail className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-black text-[#003087] tracking-tight line-clamp-1">{template.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500 animate-pulse' : 'bg-[#FFD700]'}`} />
                                                    <CardDescription className="font-bold text-gray-500 text-[10px] uppercase tracking-[0.15em] line-clamp-1">
                                                        Subject: {template.subject}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 flex flex-col flex-1">
                                    <div
                                        className="text-sm text-gray-500 font-medium leading-[1.8] line-clamp-3 overflow-hidden mb-10 min-h-[75px] max-w-md"
                                        dangerouslySetInnerHTML={{ __html: template.body }}
                                    />

                                    <div className="space-y-6 mt-auto">
                                        {!template.isActive ? (
                                            <Button
                                                onClick={() => handleToggleActive(template)}
                                                className="w-full h-14 rounded-2xl bg-white border-2 border-[#003087] text-[#003087] font-black uppercase tracking-widest text-xs hover:bg-[#003087] hover:text-white transition-all shadow-lg hover:shadow-[#003087]/20"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Set as Primary Template
                                            </Button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="w-full h-14 rounded-2xl bg-[#003087] text-white flex items-center justify-center font-black uppercase tracking-widest text-xs shadow-xl shadow-[#003087]/30 border-2 border-[#003087]">
                                                    <Sparkles className="w-4 h-4 mr-2 text-[#FFD700]" />
                                                    Currently Live
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleToggleActive(template)}
                                                    className="w-full h-10 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold text-[10px] uppercase tracking-wider transition-all"
                                                >
                                                    <X className="w-3 h-3 mr-2" />
                                                    Deactivate Template
                                                </Button>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {template.attachments?.length > 0 && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] text-gray-400 font-black uppercase tracking-wider">
                                                        <Paperclip className="w-3 h-3" />
                                                        {template.attachments.length} Files
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="w-11 h-11 rounded-2xl bg-gray-50 text-[#003087] hover:bg-[#003087] hover:text-white transition-all duration-300" onClick={() => setPreviewTemplate(template)}>
                                                    <Eye className="w-5 h-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="w-11 h-11 rounded-2xl bg-gray-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300" onClick={() => openEdit(template)}>
                                                    <Edit3 className="w-5 h-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300" onClick={() => handleDelete(template.id)}>
                                                    <Trash className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-20">
                    <Card className="border-0 shadow-2xl rounded-[4rem] bg-gradient-to-br from-[#003087] to-[#001540] p-1 overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/5 rounded-full -mr-80 -mt-80 blur-[100px] group-hover:scale-110 transition-transform" style={{ transitionDuration: '3000ms' }} />
                        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#FFD700]/5 rounded-full -ml-60 -mb-60 blur-[80px]" />

                        <CardContent className="p-12 sm:p-20 relative z-10 flex flex-col lg:flex-row items-center gap-16">
                            <div className="bg-white/10 p-10 rounded-[3rem] backdrop-blur-xl border border-white/10 shadow-3xl shrink-0 group-hover:rotate-6 transition-transform duration-700">
                                <Sparkles className="w-20 h-20 text-[#FFD700]" />
                            </div>
                            <div className="text-center lg:text-left">
                                <h3 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">Email Design Redefined.</h3>
                                <p className="text-blue-100/80 font-bold text-lg leading-relaxed max-w-3xl">
                                    Welcome to the new era of UPSA communications. Our advanced engine now supports high-definition images,
                                    complex typography, and AI-driven content generation.
                                </p>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-5 mt-10">
                                    {[
                                        { label: 'Cloud Storage', icon: <Plus className="w-3 h-3" /> },
                                        { label: 'Rich HD Images', icon: <Plus className="w-3 h-3" /> },
                                        { label: 'AI Synthesis', icon: <Plus className="w-3 h-3" /> },
                                        { label: 'Smart Variables', icon: <Plus className="w-3 h-3" /> }
                                    ].map((tag, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] transition-colors cursor-default rounded-2xl border border-white/5 text-[11px] font-black text-white tracking-widest uppercase shadow-sm">
                                            {tag.icon} {tag.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
