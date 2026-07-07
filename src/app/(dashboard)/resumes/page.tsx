"use client";

import React, { useEffect, useState } from "react";
import { useApplicationStore } from "@/store/application.store";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  FileText,
  Plus,
  Calendar,
  ExternalLink,
  Upload,
  Eye,
  Trash2,
  AlertCircle,
  Edit,
  Copy,
  Check,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";

export default function ResumesPage() {
  const { applications, fetchApplications } = useApplicationStore();
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Preview state
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewApiUrl, setPreviewApiUrl] = useState<string | null>(null);

  // Form states (Add Form)
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("1");
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states (Edit Form)
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVersion, setEditVersion] = useState("1");
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Copy Clipboard State
  const [copiedResumeId, setCopiedResumeId] = useState<string | null>(null);

  const getSecureFileUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) {
      const filename = url.replace("/uploads/", "");
      return `/api/resumes/view/${filename}`;
    }
    return url;
  };

  const openPreview = async (rawUrl: string) => {
    const apiUrl = getSecureFileUrl(rawUrl);
    setPreviewApiUrl(apiUrl);
    setBlobPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      setBlobPreviewUrl(objectUrl);
    } catch (err: any) {
      console.error("PDF preview error:", err);
      setPreviewError("Failed to render PDF preview. Open details in a new tab.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (blobPreviewUrl) {
      URL.revokeObjectURL(blobPreviewUrl);
    }
    setBlobPreviewUrl(null);
    setPreviewApiUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
  };

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus template resume ini? Hubungan dengan lamaran kerja yang menggunakan resume ini akan otomatis terlepas."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Resume template berhasil dihapus!");
        fetchResumes();
      } else {
        const err = await res.json();
        toast.error(err.message || "Gagal menghapus resume template.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan saat menghapus resume.");
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchResumes();
  }, [fetchApplications]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForm = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (isEditForm) {
      setIsEditUploading(true);
    } else {
      setIsUploading(true);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (isEditForm) {
          setEditFileUrl(data.fileUrl);
        } else {
          setFileUrl(data.fileUrl);
        }
        toast.success("Resume file uploaded successfully!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Upload failed");
      }
    } catch {
      toast.error("Failed to upload file");
    } finally {
      if (isEditForm) {
        setIsEditUploading(false);
      } else {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title) {
      setFormError("Title is required");
      return;
    }

    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          fileUrl: fileUrl || null,
          content: content || null,
          version: parseInt(version) || 1,
        }),
      });

      if (res.ok) {
        setTitle("");
        setFileUrl("");
        setContent("");
        setVersion("1");
        setIsAddModalOpen(false);
        fetchResumes();
        toast.success("Resume profile saved successfully!");
      } else {
        const err = await res.json();
        setFormError(err.message || "Failed to create resume profile");
      }
    } catch (e) {
      setFormError("Network error. Failed to save resume template.");
    }
  };

  const handleOpenEditModal = (resume: any) => {
    setEditingResumeId(resume.id);
    setEditTitle(resume.title);
    setEditFileUrl(resume.fileUrl || "");
    setEditContent(resume.content || "");
    setEditVersion(String(resume.version));
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);

    if (!editTitle) {
      setEditFormError("Title is required");
      return;
    }

    try {
      const res = await fetch(`/api/resumes/${editingResumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          fileUrl: editFileUrl || null,
          content: editContent || null,
          version: parseInt(editVersion) || 1,
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchResumes();
        toast.success("Resume profile updated successfully!");
      } else {
        const err = await res.json();
        setEditFormError(err.message || "Failed to update resume profile");
      }
    } catch (e) {
      setEditFormError("Network error. Failed to update resume.");
    }
  };

  const handleCopyText = (resumeId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResumeId(resumeId);
    toast.success("Resume text content copied to clipboard!");
    setTimeout(() => setCopiedResumeId(null), 2000);
  };

  const getLinkedAppsCount = (resumeId: string) => {
    return applications.filter((app) => app.resumeId === resumeId).length;
  };

  // Stats summaries
  const totalResumes = resumes.length;
  const totalLinkedApps = resumes.reduce((acc, r) => acc + getLinkedAppsCount(r.id), 0);
  const resumesWithoutContent = resumes.filter((r) => !r.content || r.content.trim() === "").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Mesh Gradient Glass Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-150/45 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-sm">
        {/* Decorator lighting */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 border border-indigo-500/20 select-none">
              <Sparkles size={10} className="animate-pulse" /> Document Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Resume Manager</h1>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-xl">
              Organisasikan file lamaran Anda. Tambahkan konten teks CV pada masing-masing template agar fitur **AI Matcher** dapat mendeteksi kecocokan ATS secara otomatis.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3.5 transition-all cursor-pointer shadow-md shadow-indigo-900/10 select-none shrink-0"
          >
            <Plus size={14} />
            <span>Create CV Template</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-card rounded-3xl p-5 border border-slate-150/45 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Total CV Templates</span>
            <span className="text-2xl font-black text-slate-800">{totalResumes}</span>
          </div>
          <div className="h-10 w-10 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center text-indigo-650 font-bold">
            <FileText size={18} />
          </div>
        </div>

        <div className="surface-card rounded-3xl p-5 border border-slate-150/45 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Associated Applications</span>
            <span className="text-2xl font-black text-slate-800">{totalLinkedApps}</span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-emerald-650 font-bold">
            <LinkIcon size={18} />
          </div>
        </div>

        <div className="surface-card rounded-3xl p-5 border border-slate-150/45 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">No-Text Alerts</span>
            <span className="text-2xl font-black text-slate-800">{resumesWithoutContent}</span>
          </div>
          <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center font-bold ${
            resumesWithoutContent > 0 
              ? "bg-rose-50 border-rose-100 text-rose-650" 
              : "bg-slate-50 border-slate-200 text-slate-450"
          }`}>
            <AlertCircle size={18} />
          </div>
        </div>
      </div>

      {/* Grid of resume profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && resumes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-450 font-medium">
            <svg className="animate-spin h-6 w-6 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading CV Library...</span>
          </div>
        ) : resumes.length === 0 ? (
          <div className="surface-card col-span-full rounded-3xl p-12 text-center text-slate-500 border border-slate-150">
            <FileText size={36} className="mx-auto mb-3 text-slate-350" />
            <p className="font-extrabold text-slate-800 text-sm">Belum Ada Template Resume</p>
            <p className="mt-1.5 text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
              Silakan buat template resume pertama Anda agar bisa langsung dikaitkan ke lamaran kerja di dashboard.
            </p>
          </div>
        ) : (
          resumes.map((resume) => {
            const appsLinked = getLinkedAppsCount(resume.id);
            const secureUrl = getSecureFileUrl(resume.fileUrl);
            const isPDF = secureUrl.toLowerCase().endsWith(".pdf");
            const hasTextContent = resume.content && resume.content.trim() !== "";
            const wordCount = hasTextContent ? resume.content.trim().split(/\s+/).length : 0;

            return (
              <div
                key={resume.id}
                className="surface-card flex flex-col justify-between rounded-3xl p-6 border border-slate-150/45 hover:border-indigo-200 shadow-3xs hover:shadow-2xs transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Card Title & Version block */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-650 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 truncate" title={resume.title}>
                          {resume.title}
                        </h3>
                        <span className="rounded-full border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[8.5px] font-extrabold text-indigo-700 mt-1 inline-block select-none">
                          Version {resume.version}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning tag if text is empty */}
                  {!hasTextContent && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 flex gap-2 text-amber-700 leading-relaxed">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider block">No Text Content</span>
                        <span className="text-[10px] leading-normal text-amber-600 block">
                          Teks CV belum disalin. AI Matcher tidak dapat menganalisis resume ini.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content snippet view */}
                  {hasTextContent && (
                    <div className="rounded-2xl border border-slate-150 bg-slate-50/40 p-4 space-y-2 relative group/text">
                      <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-widest select-none">
                        <span>Keywords / CV Text ({wordCount} words)</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(resume.id, resume.content)}
                          className="opacity-0 group-hover/text:opacity-100 text-indigo-650 hover:text-indigo-550 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedResumeId === resume.id ? <Check size={9} /> : <Copy size={9} />}
                          <span>{copiedResumeId === resume.id ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="text-[10.5px] leading-relaxed text-slate-600 max-h-20 overflow-y-auto whitespace-pre-wrap">
                        {resume.content}
                      </div>
                    </div>
                  )}

                  {/* PDF Document attachment indicator info */}
                  {secureUrl && (
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-150 bg-slate-50/30 text-xs">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-600 truncate">
                          {isPDF ? "PDF Attachment is ready" : "File Attachment is linked"}
                        </span>
                      </div>
                      {isPDF && (
                        <button
                          type="button"
                          onClick={() => openPreview(resume.fileUrl)}
                          className="text-[9px] font-extrabold text-indigo-650 hover:underline uppercase shrink-0 cursor-pointer"
                        >
                          Preview File
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Toolbar actions and Stats footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold select-none">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={11} />
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </span>
                    <span className="rounded-xl border border-slate-150 bg-slate-50/60 px-2 py-0.5 flex items-center gap-1">
                      <LinkIcon size={10} />
                      <span>Linked to {appsLinked} apps</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(resume)}
                      className="w-full flex items-center justify-center gap-1 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white py-2 text-xs font-bold text-slate-700 hover:text-indigo-750 transition-colors cursor-pointer"
                    >
                      <Edit size={11} />
                      <span>Edit Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(resume.id)}
                      className="w-full flex items-center justify-center gap-1 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/20 hover:bg-rose-50/70 py-2 text-xs font-bold text-rose-700 transition-all cursor-pointer"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Resume Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Upload Resume Template">
        {formError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-600">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                id="resumeTitle"
                label="Template Title"
                placeholder="e.g. Senior Frontend Resume"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <Input
              id="resumeVersion"
              label="Version No."
              type="number"
              min="1"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
            />
          </div>

          {/* Interactive File Upload Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Upload PDF Resume File</label>
            {fileUrl ? (
              <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 text-xs text-emerald-800">
                <span className="truncate max-w-[280px]">File path: {fileUrl}</span>
                <button
                  type="button"
                  onClick={() => setFileUrl("")}
                  className="font-bold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Change File
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/40 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer">
                <Upload size={24} className="text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-700">
                  {isUploading ? "Uploading file..." : "Choose or Drag PDF File"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Maximum size 5MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e, false)}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <Textarea
              id="resumeContent"
              label="Resume Text Content (Wajib agar AI dapat membaca CV Anda)"
              placeholder="Copy dan paste seluruh konten teks dari CV Anda di sini. Ini wajib diisi agar AI Resume Matcher di detail lamaran dapat mencocokkan keahlian Anda."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <p className="text-[10px] font-bold text-indigo-700 select-none">
              ✨ Pastikan isi teks CV Anda ditempel di sini agar Gemini AI dapat mengevaluasi ATS score Anda dengan akurat.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              Save Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Resume Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Resume Template">
        {editFormError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-600">
            {editFormError}
          </div>
        )}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                id="editResumeTitle"
                label="Template Title"
                placeholder="e.g. Senior Frontend Resume"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            <Input
              id="editResumeVersion"
              label="Version No."
              type="number"
              min="1"
              value={editVersion}
              onChange={(e) => setEditVersion(e.target.value)}
              required
            />
          </div>

          {/* Interactive File Upload Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Uploaded PDF Resume File</label>
            {editFileUrl ? (
              <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 text-xs text-emerald-800">
                <span className="truncate max-w-[280px]">File path: {editFileUrl}</span>
                <button
                  type="button"
                  onClick={() => setEditFileUrl("")}
                  className="font-bold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Change File
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/40 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer">
                <Upload size={24} className="text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-700">
                  {isEditUploading ? "Uploading file..." : "Choose or Drag PDF File"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Maximum size 5MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e, true)}
                  disabled={isEditUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <Textarea
              id="editResumeContent"
              label="Resume Text Content (Wajib agar AI dapat membaca CV Anda)"
              placeholder="Copy dan paste seluruh konten teks dari CV Anda di sini. Ini wajib diisi agar AI Resume Matcher di detail lamaran dapat mencocokkan keahlian Anda."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
            />
            <p className="text-[10px] font-bold text-indigo-700 select-none">
              ✨ Pastikan isi teks CV Anda ditempel di sini agar Gemini AI dapat mengevaluasi ATS score Anda dengan akurat.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isEditUploading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewLoading || !!blobPreviewUrl || !!previewError}
        onClose={closePreview}
        title="Resume Overview Preview"
        className="max-w-4xl"
      >
        {previewApiUrl && (
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-150 mb-4">
            <span>Preview tidak muncul?</span>
            <div className="flex gap-3">
              <a
                href={previewApiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-700 hover:text-indigo-650 transition-colors inline-flex items-center gap-1"
              >
                Buka di Tab Baru <ExternalLink size={12} />
              </a>
              <span className="text-slate-300">|</span>
              <a
                href={previewApiUrl}
                download
                className="font-bold text-indigo-700 hover:text-indigo-650 transition-colors inline-flex items-center gap-1"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {isPreviewLoading && (
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-500">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Memuat preview resume...</span>
          </div>
        )}

        {previewError && !isPreviewLoading && (
          <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
            <AlertCircle size={36} className="text-rose-400" />
            <span className="text-sm font-medium text-slate-700">{previewError}</span>
          </div>
        )}

        {blobPreviewUrl && !isPreviewLoading && (
          <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-slate-150 bg-slate-50">
            <iframe src={blobPreviewUrl} className="w-full h-full" title="PDF Resume Preview" />
          </div>
        )}
      </Modal>
    </div>
  );
}
