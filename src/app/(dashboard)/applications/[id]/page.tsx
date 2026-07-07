'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useApplicationStore, 
  StageType, 
  JobType, 
  SourcePlatform 
} from '@/store/application.store';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CompanyAvatar } from '@/components/ui/CompanyAvatar';
import { 
  ArrowLeft, 
  Calendar, 
  Trash2, 
  ExternalLink,
  Edit2,
  FileText,
  MessageSquare,
  AlertCircle,
  Eye,
  Briefcase as BriefcaseIcon,
  Users,
  Plus,
  Mail,
  Phone,
  Link2,
  DollarSign,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

type Params = {
  params: Promise<{ id: string }>;
};

const stageColors: Record<StageType, { bg: string; text: string; dot: string }> = {
  WATCHING: { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-500", dot: "bg-slate-400" },
  PREPARED: { bg: "bg-indigo-50 text-indigo-700 border-indigo-150/80", text: "text-indigo-500", dot: "bg-indigo-500" },
  APPLIED: { bg: "bg-sky-50 text-sky-700 border-sky-150/80", text: "text-sky-500", dot: "bg-sky-500" },
  HR_SCREENING: { bg: "bg-amber-50 text-amber-700 border-amber-150/80", text: "text-amber-500", dot: "bg-amber-500" },
  INTERVIEW_1: { bg: "bg-purple-50 text-purple-700 border-purple-150/80", text: "text-purple-500", dot: "bg-purple-500" },
  INTERVIEW_2: { bg: "bg-violet-50 text-violet-700 border-violet-150/80", text: "text-violet-500", dot: "bg-violet-500" },
  REVIEW: { bg: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-150/80", text: "text-fuchsia-500", dot: "bg-fuchsia-500" },
  OFFER: { bg: "bg-emerald-50 text-emerald-700 border-emerald-150/80", text: "text-emerald-500", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-rose-50 text-rose-700 border-rose-150/80", text: "text-rose-500", dot: "bg-rose-500" },
};

const stepperSteps = [
  { key: 'WATCHING', label: 'Saved' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'HR_SCREENING', label: 'Screening' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'OFFER', label: 'Offer' }
];

const getStepperProgress = (currentStage: StageType) => {
  if (currentStage === 'REJECTED') return 100;
  const mapping: Record<StageType, number> = {
    WATCHING: 0,
    PREPARED: 0,
    APPLIED: 25,
    HR_SCREENING: 50,
    REVIEW: 50,
    INTERVIEW_1: 75,
    INTERVIEW_2: 75,
    OFFER: 100,
    REJECTED: 100
  };
  return mapping[currentStage] || 0;
};

const isStepActive = (currentStage: StageType, stepKey: string) => {
  if (currentStage === 'REJECTED') return true;
  const order = ['WATCHING', 'APPLIED', 'HR_SCREENING', 'INTERVIEW', 'OFFER'];
  const currentIdx = order.indexOf(
    currentStage === 'PREPARED' 
      ? 'WATCHING' 
      : currentStage === 'REVIEW' 
        ? 'HR_SCREENING' 
        : ['INTERVIEW_1', 'INTERVIEW_2'].includes(currentStage) 
          ? 'INTERVIEW' 
          : currentStage
  );
  const stepIdx = order.indexOf(stepKey);
  return currentIdx >= stepIdx;
};

const isStepCurrent = (currentStage: StageType, stepKey: string) => {
  if (currentStage === 'REJECTED' && stepKey === 'OFFER') return true;
  const normalized = currentStage === 'PREPARED' 
    ? 'WATCHING' 
    : currentStage === 'REVIEW' 
      ? 'HR_SCREENING' 
      : ['INTERVIEW_1', 'INTERVIEW_2'].includes(currentStage) 
        ? 'INTERVIEW' 
        : currentStage;
  return normalized === stepKey;
};

export default function ApplicationDetailPage({ params }: Params) {
  const router = useRouter();
  const { 
    applications,
    fetchApplications, 
    updateApplication,
    changeStage,
    addNote,
    addReminder,
    toggleReminder,
    deleteApplication,
    addContact,
    deleteContact,
    isLoading
  } = useApplicationStore();

  const [id, setId] = useState<string | null>(null);

  // Unwrap params safely
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Active state data
  const application = applications.find(a => a.id === id);

  // Edit details modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState<JobType>('FULL_TIME');
  const [editPlatform, setEditPlatform] = useState<SourcePlatform>('LINKEDIN');
  const [editSalaryMin, setEditSalaryMin] = useState('');
  const [editSalaryMax, setEditSalaryMax] = useState('');
  const [editSalaryCurrency, setEditSalaryCurrency] = useState('IDR');
  const [editBenefits, setEditBenefits] = useState('');

  // Stage change states
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [nextStage, setNextStage] = useState<StageType>('APPLIED');
  const [stageNote, setStageNote] = useState('');

  // Reminder states
  const [reminderType, setReminderType] = useState('FOLLOW_UP');
  const [reminderDate, setReminderDate] = useState('');

  // Note tab states
  const [activeNotesTab, setActiveNotesTab] = useState<'GENERAL' | 'INTERVIEW_PREP' | 'JOB_DESCRIPTION'>('GENERAL');
  const [noteContent, setNoteContent] = useState('');
  const [prepTitle, setPrepTitle] = useState('');

  // Job Description / AI Match states
  const [editJdText, setEditJdText] = useState('');
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState<any>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // Contacts states
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLinkedin, setContactLinkedin] = useState('');
  const [contactNotes, setContactNotes] = useState('');

  // Resumes states
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);

  // Deletion confirm modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load app details and resumes
  useEffect(() => {
    fetchApplications();
    
    // Load resumes list
    fetch('/api/resumes')
      .then(res => res.json())
      .then(data => setResumes(data.resumes || []))
      .catch(e => console.error(e));
  }, [fetchApplications]);

  // Set default values when application is loaded
  useEffect(() => {
    if (application) {
      setEditCompany(application.companyName);
      setEditLogo(application.companyLogo || '');
      setEditRole(application.roleTitle);
      setEditLocation(application.location || '');
      setEditUrl(application.jobUrl || '');
      setEditType(application.jobType);
      setEditPlatform(application.sourcePlatform);
      setSelectedResumeId(application.resumeId || '');
      setEditSalaryMin(application.salaryMin ? String(application.salaryMin) : '');
      setEditSalaryMax(application.salaryMax ? String(application.salaryMax) : '');
      setEditSalaryCurrency(application.salaryCurrency || 'IDR');
      setEditBenefits(application.benefits || '');
      setEditJdText(application.jobDescription || '');
    }
  }, [application]);

  // Fetch and cache PDF blob for Associated Resume Preview
  const selectedResume = resumes.find(r => r.id === selectedResumeId);
  useEffect(() => {
    if (isResumePreviewOpen && selectedResume) {
      fetch(`/api/resumes/view/${selectedResume.fileName}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          setResumeBlobUrl(blobUrl);
        })
        .catch((err) => console.error("Error loading PDF blob:", err));
    } else {
      if (resumeBlobUrl) {
        URL.revokeObjectURL(resumeBlobUrl);
        setResumeBlobUrl(null);
      }
    }
  }, [isResumePreviewOpen, selectedResumeId, resumes]);

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500 space-y-3">
        <AlertCircle size={40} className="text-indigo-500 animate-bounce" />
        <div>
          <p className="font-semibold text-slate-700 text-center">Searching for application details...</p>
          <p className="text-xs text-slate-400 text-center mt-1">Please wait while we retrieve the records.</p>
        </div>
        <button onClick={() => router.push('/applications')} className="text-xs text-indigo-600 font-bold hover:underline">
          Back to Applications List
        </button>
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) { toast.error("Failed to read file."); return; }

      try {
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 128;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
            } else {
              if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              setEditLogo(canvas.toDataURL("image/png"));
            } else {
              setEditLogo(rawDataUrl);
            }
          } catch { setEditLogo(rawDataUrl); }
        };
        img.onerror = () => { setEditLogo(rawDataUrl); };
        img.src = rawDataUrl;
      } catch { setEditLogo(rawDataUrl); }
    };
    reader.onerror = () => { toast.error("Failed to read the selected file."); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateApplication(application.id, {
      companyName: editCompany,
      companyLogo: editLogo || null,
      roleTitle: editRole,
      location: editLocation || null,
      jobUrl: editUrl || null,
      jobType: editType,
      sourcePlatform: editPlatform,
      salaryMin: editSalaryMin ? Number(editSalaryMin) : null,
      salaryMax: editSalaryMax ? Number(editSalaryMax) : null,
      salaryCurrency: editSalaryCurrency,
      benefits: editBenefits || null
    });
    if (success) {
      setIsEditModalOpen(false);
    }
  };

  const handleStageChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await changeStage(application.id, nextStage, stageNote);
    if (success) {
      setStageNote('');
      setIsStageModalOpen(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    const noteType = activeNotesTab;
    const title = noteType === 'INTERVIEW_PREP' ? (prepTitle.trim() || 'Interview Round') : undefined;

    const success = await addNote(application.id, noteContent, noteType, title);
    if (success) {
      setNoteContent('');
      setPrepTitle('');
    }
  };

  const handleAddReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDate) return;
    const success = await addReminder(application.id, reminderType, reminderDate);
    if (success) {
      setReminderDate('');
    }
  };

  const handleToggleReminder = async (reminderId: string, currentStatus: boolean) => {
    await toggleReminder(reminderId, !currentStatus);
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    const success = await addContact(application.id, {
      name: contactName.trim(),
      role: contactRole.trim() || null,
      email: contactEmail.trim() || null,
      phone: contactPhone.trim() || null,
      linkedinUrl: contactLinkedin.trim() || null,
      notes: contactNotes.trim() || null
    });

    if (success) {
      setContactName('');
      setContactRole('');
      setContactEmail('');
      setContactPhone('');
      setContactLinkedin('');
      setContactNotes('');
      setIsAddingContact(false);
    }
  };

  const handleResumeMap = async (resumeId: string) => {
    setSelectedResumeId(resumeId);
    await updateApplication(application.id, {
      resumeId: resumeId || null
    });
  };

  const handleDeleteAppConfirm = async () => {
    const success = await deleteApplication(application.id);
    if (success) {
      router.push('/applications');
    }
  };

  const handleSaveJd = async () => {
    const success = await updateApplication(application.id, {
      jobDescription: editJdText
    });
    if (success) {
      setIsEditingJd(false);
      toast.success("Job Description updated successfully!");
    }
  };

  const handleAnalyzeResumeMatch = async (forceRefresh = false) => {
    const selectedRes = resumes.find(r => r.id === selectedResumeId);
    if (!selectedRes) {
      toast.error("Please assign a resume to this application first.");
      return;
    }
    if (!selectedRes.content || selectedRes.content.trim() === '') {
      toast.error("Resume Anda belum memiliki konten teks. Silakan buka Resume Manager dan paste teks CV Anda di kolom yang tersedia.");
      return;
    }
    if (!application.jobDescription) {
      toast.error("Please add a Job Description to this application first.");
      return;
    }

    // Check if cache exists and not forcing refresh
    if (!forceRefresh && application.aiMatchAnalysis) {
      try {
        const cached = JSON.parse(application.aiMatchAnalysis);
        setMatchAnalysis(cached);
        setIsMatchModalOpen(true);
        toast.success("Loaded AI analysis from database cache!");
        return;
      } catch (e) {
        console.error("Failed to parse cached analysis, re-running:", e);
      }
    }

    setIsAnalyzingMatch(true);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContent: selectedRes.content || "",
          jobDescription: application.jobDescription,
          applicationId: application.id,
          forceRefresh: forceRefresh
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setMatchAnalysis(result.analysis);
        setIsMatchModalOpen(true);
        
        // Re-fetch applications in background to sync the local cache state
        await fetchApplications();
        
        toast.success(forceRefresh ? "AI Analysis refreshed successfully!" : "AI Compatibility analysis completed!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to analyze resume match.");
      }
    } catch (e) {
      toast.error("Network error. Failed to run match analysis.");
    } finally {
      setIsAnalyzingMatch(false);
    }
  };

  // Filter notes based on active tab
  const filteredNotes = (application.notes || []).filter(note => {
    if (activeNotesTab === 'GENERAL') {
      return !note.type || note.type === 'GENERAL';
    }
    return note.type === 'INTERVIEW_PREP';
  });

  return (
    <div className="space-y-8">
      {/* Back & Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/applications')}
            className="p-2 text-slate-500 hover:text-indigo-700 bg-white border border-slate-200 rounded-xl transition-all shadow-3xs cursor-pointer hover:border-indigo-200"
          >
            <ArrowLeft size={16} />
          </button>
          <CompanyAvatar companyName={application.companyName} companyLogo={application.companyLogo} size="lg" className="h-12 w-12 rounded-2xl shadow-2xs border border-slate-100" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{application.companyName}</h1>
              <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full tracking-wide">
                {application.jobType.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{application.roleTitle} • {application.location || 'Remote/N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsDeleteModalOpen(true)}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-350 gap-2 shrink-0 shadow-2xs"
          >
            <Trash2 size={14} /> Delete
          </Button>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="gap-2 shrink-0 shadow-2xs">
            <Edit2 size={14} /> Edit Details
          </Button>
          <Button onClick={() => { setNextStage(application.currentStage); setIsStageModalOpen(true); }} className="gap-2 shrink-0 shadow-2xs">
            Update Stage
          </Button>
        </div>
      </div>

      {/* Horizontal Progress Stepper */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2 flex items-center justify-between">Pipeline Progress</h3>
        <div className="flex items-center justify-between relative max-w-2xl mx-auto px-4">
          {/* Connecting Line (Inactive Dashed) */}
          <div className="absolute top-4 left-8 right-8 h-1.5 inactive-dashed-line -translate-y-1/2 z-0" />
          {/* Active Progress Line (Animated Moving Dashed) */}
          <div 
            className={`absolute top-4 left-8 h-1.5 -translate-y-1/2 z-0 transition-all duration-500 ease-out ${
              application.currentStage === 'REJECTED' ? 'animate-march-red' : 'animate-march'
            }`} 
            style={{ width: `${getStepperProgress(application.currentStage)}%` }}
          />
          {stepperSteps.map((step, idx) => {
            const isActive = isStepActive(application.currentStage, step.key);
            const isCurrent = isStepCurrent(application.currentStage, step.key);
            const isRejected = application.currentStage === 'REJECTED';

            return (
              <div key={idx} className="flex flex-col items-center gap-2 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-xs relative z-10 ${
                  isCurrent
                    ? isRejected 
                      ? 'bg-rose-500 border-rose-500 text-white animate-pulse-ring-red'
                      : 'bg-indigo-500 border-indigo-500 text-white animate-pulse-ring shadow-sm shadow-indigo-500/20'
                    : isActive
                      ? 'bg-white border-indigo-500 text-indigo-655 font-bold'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  isCurrent 
                    ? isRejected ? 'text-rose-600 font-extrabold' : 'text-indigo-600 font-extrabold'
                    : isActive ? 'text-slate-655 font-extrabold' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Pipeline & Notes */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress Timeline card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Application Stages Log</h3>
            <div className="max-h-[220px] overflow-y-auto pr-1.5 space-y-4 relative pt-2 pl-4 ml-2 border-l border-slate-200">
              {(application.stages || []).map((stageLog) => {
                const isCurrent = !stageLog.leftAt;
                const chosenStage = stageLog.stage as StageType;
                const colors = stageColors[chosenStage] || stageColors.WATCHING;

                const formatDateRange = (enteredAtStr: string, leftAtStr: string | null) => {
                  const start = new Date(enteredAtStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  if (!leftAtStr) {
                    return `${start} – Active`;
                  }
                  const end = new Date(leftAtStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  return `${start} – ${end}`;
                };

                return (
                  <div key={stageLog.id} className="relative group min-h-[24px] flex items-center">
                    {/* Timeline dot matching transition color */}
                    <div className={`absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ring-4 ring-white ${
                      isCurrent ? colors.dot + ' animate-pulse' : 'bg-slate-300'
                    }`} />
                    
                    <div className="flex flex-wrap items-center gap-2.5 w-full text-xs">
                      <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${colors.bg}`}>
                        {stageLog.stage.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold shrink-0 ${isCurrent ? 'text-indigo-650' : 'text-slate-450'}`}>
                        {formatDateRange(stageLog.enteredAt, stageLog.leftAt)}
                      </span>
                      {stageLog.note && (
                        <span className="text-[11px] text-slate-450 italic truncate max-w-[280px] md:max-w-[380px]" title={stageLog.note}>
                          • &quot;{stageLog.note}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Card - Tabbed version */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-655" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Research & Notes</h3>
              </div>

              {/* Tab Toggles */}
              <div className="flex bg-slate-100 rounded-xl p-1 text-[11px] font-bold uppercase tracking-wider w-fit shrink-0 select-none">
                <button 
                  onClick={() => setActiveNotesTab('GENERAL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeNotesTab === 'GENERAL' 
                      ? 'bg-white text-indigo-700 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General Notes
                </button>
                <button 
                  onClick={() => setActiveNotesTab('INTERVIEW_PREP')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeNotesTab === 'INTERVIEW_PREP' 
                      ? 'bg-white text-indigo-700 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Interview Prep
                </button>
                <button 
                  onClick={() => setActiveNotesTab('JOB_DESCRIPTION')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeNotesTab === 'JOB_DESCRIPTION' 
                      ? 'bg-white text-indigo-700 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Job Description
                </button>
              </div>
            </div>

            {/* Note form / JD Editor */}
            {activeNotesTab !== 'JOB_DESCRIPTION' ? (
              <>
                <form onSubmit={handleAddNoteSubmit} className="space-y-4">
                  {activeNotesTab === 'INTERVIEW_PREP' && (
                    <Input
                      id="prepTitle"
                      label="Session Title"
                      placeholder="e.g. Technical Screening, System Design round, CEO Final Interview..."
                      value={prepTitle}
                      onChange={(e) => setPrepTitle(e.target.value)}
                      required={activeNotesTab === 'INTERVIEW_PREP'}
                      className="bg-white border-slate-200 text-xs"
                    />
                  )}
                  
                  <Textarea
                    placeholder={
                      activeNotesTab === 'GENERAL'
                        ? "Add company details, tech stack notes, key research links, or insights..."
                        : "Jot down anticipated coding questions, behavioral answer blueprints, salary negotiations targets, or questions to ask the interviewers..."
                    }
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="bg-white border-slate-200"
                  />
                  <Button type="submit" size="sm" className="shadow-2xs">
                    Save {activeNotesTab === 'GENERAL' ? 'Note' : 'Prep Session'}
                  </Button>
                </form>

                {/* Notes list */}
                <div className="space-y-4 pt-2">
                  {filteredNotes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      {activeNotesTab === 'GENERAL' 
                        ? 'No general research notes added yet. Record company specifics here.'
                        : 'No interview prep journals logged yet. Prepare for your rounds here.'}
                    </p>
                  ) : (
                    filteredNotes.map((note) => (
                      <div key={note.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 shadow-3xs space-y-1.5">
                        {note.type === 'INTERVIEW_PREP' && note.title && (
                          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                            {note.title}
                          </h4>
                        )}
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        <span className="text-[9px] text-slate-400 font-semibold block pt-1">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {isEditingJd || !application.jobDescription ? (
                  <div className="space-y-3">
                    <textarea
                      placeholder="Paste the original job posting details, qualifications, requirements, and salary details here..."
                      value={editJdText}
                      onChange={(e) => setEditJdText(e.target.value)}
                      className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[200px] resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveJd}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-3xs cursor-pointer transition-colors"
                      >
                        Save Job Description
                      </button>
                      {application.jobDescription && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditJdText(application.jobDescription || '');
                            setIsEditingJd(false);
                          }}
                          className="rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-indigo-50/20 border border-indigo-100/40 p-3.5 rounded-2xl">
                      <span className="text-xs text-slate-500 font-medium">Job Description is saved. You can now analyze ATS compatibility.</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingJd(true)}
                        className="text-xs font-extrabold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} />
                        Edit Description
                      </button>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-200/60 shadow-3xs text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {application.jobDescription}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Specs, Contacts, Resume, Reminders */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Specifications including Salary Range */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Specs</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-450 font-medium">Source Platform</p>
                <p className="font-bold text-slate-700 mt-0.5 uppercase tracking-wide text-[10px]">{application.sourcePlatform}</p>
              </div>
              <div>
                <p className="text-slate-450 font-medium">Creation Date</p>
                <p className="font-bold text-slate-700 mt-0.5">{new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-450 font-medium">Date Applied</p>
                <p className="font-bold text-slate-700 mt-0.5">
                  {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-450 font-medium">Job URL</p>
                {application.jobUrl ? (
                  <a 
                    href={application.jobUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold text-indigo-650 hover:text-indigo-550 transition-colors mt-0.5 flex items-center gap-0.5"
                  >
                    Open Post <ExternalLink size={10} />
                  </a>
                ) : (
                  <p className="font-semibold text-slate-400 mt-0.5">Not provided</p>
                )}
              </div>
              
              {/* Compensation details */}
              <div className="col-span-2 border-t border-slate-100 pt-3 flex flex-col gap-1">
                <p className="text-slate-450 font-medium">Compensation Package</p>
                {application.salaryMin || application.salaryMax ? (
                  <div>
                    <p className="font-bold text-slate-750 flex items-center gap-1">
                      <DollarSign size={12} className="text-indigo-600" />
                      <span>
                        {application.salaryMin ? `${application.salaryCurrency} ${application.salaryMin.toLocaleString()}` : 'N/A'}
                        {' – '}
                        {application.salaryMax ? `${application.salaryCurrency} ${application.salaryMax.toLocaleString()}` : 'N/A'}
                      </span>
                    </p>
                    {application.benefits && (
                      <p className="text-[10px] text-slate-450 mt-1 italic line-clamp-2" title={application.benefits}>
                        Benefits: {application.benefits}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="font-semibold text-slate-400">Not recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Hiring Team & Contacts (P1) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-655" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Hiring Team</h3>
              </div>
              <button 
                onClick={() => setIsAddingContact(!isAddingContact)}
                className="text-slate-500 hover:text-indigo-700 hover:bg-slate-50 p-1 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Add Contact Form toggle */}
            {isAddingContact && (
              <form onSubmit={handleAddContactSubmit} className="space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-150">
                <Input
                  id="contactName"
                  placeholder="Full Name *"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-xs px-2.5 py-1.5"
                />
                <Input
                  id="contactRole"
                  placeholder="Role (e.g. Talent Acquisition, Tech Lead)"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="bg-white border-slate-200 text-xs px-2.5 py-1.5"
                />
                <Input
                  id="contactEmail"
                  placeholder="Email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-white border-slate-200 text-xs px-2.5 py-1.5"
                />
                <Input
                  id="contactPhone"
                  placeholder="Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="bg-white border-slate-200 text-xs px-2.5 py-1.5"
                />
                <Input
                  id="contactLinkedin"
                  placeholder="LinkedIn URL"
                  value={contactLinkedin}
                  onChange={(e) => setContactLinkedin(e.target.value)}
                  className="bg-white border-slate-200 text-xs px-2.5 py-1.5"
                />
                <Textarea
                  placeholder="Add notes about them..."
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  className="bg-white border-slate-200 text-xs px-2.5 py-1.5 min-h-[60px]"
                />
                <div className="flex justify-end gap-2 text-[10px] pt-1">
                  <Button type="button" variant="secondary" onClick={() => setIsAddingContact(false)} className="px-2.5 py-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="px-2.5 py-1">
                    Add Team Member
                  </Button>
                </div>
              </form>
            )}

            {/* List contacts */}
            <div className="space-y-3">
              {(application.contacts || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hiring team members recorded yet.</p>
              ) : (
                (application.contacts || []).map((cont) => (
                  <div key={cont.id} className="p-3 rounded-2xl bg-slate-50/50 border border-slate-200/60 shadow-3xs relative group flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{cont.name}</p>
                      {cont.role && <p className="text-[10px] font-semibold text-indigo-700 truncate">{cont.role}</p>}
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1.5 text-[10px] text-slate-450">
                        {cont.email && (
                          <a href={`mailto:${cont.email}`} className="flex items-center gap-1 hover:text-indigo-600">
                            <Mail size={10} />
                            <span className="truncate">{cont.email}</span>
                          </a>
                        )}
                        {cont.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={10} />
                            <span>{cont.phone}</span>
                          </div>
                        )}
                        {cont.linkedinUrl && (
                          <a href={cont.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-indigo-600">
                            <Link2 size={10} />
                            <span>LinkedIn</span>
                          </a>
                        )}
                      </div>
                      {cont.notes && <p className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-100 pt-1.5 line-clamp-2">{cont.notes}</p>}
                    </div>

                    <button 
                      onClick={() => deleteContact(application.id, cont.id)}
                      className="text-slate-350 hover:text-rose-600 rounded-lg p-1 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Remove contact"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resume Version Association */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText size={16} className="text-indigo-655" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Associated Resume</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                className="w-full text-xs px-3 py-2 glass-input bg-white border-slate-200"
                value={selectedResumeId}
                onChange={(e) => handleResumeMap(e.target.value)}
              >
                <option value="">-- No Resume Assigned --</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} (v{r.version})
                  </option>
                ))}
              </select>
              {selectedResumeId && (
                <button
                  onClick={() => setIsResumePreviewOpen(true)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-3xs cursor-pointer shrink-0"
                  title="Preview Resume"
                >
                  <Eye size={14} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Link a customized resume profile to this application. Manage templates in the <a href="/resumes" className="text-indigo-650 font-bold hover:underline">Resume Manager</a>.
            </p>
            {selectedResumeId && (
              <div className="pt-2 border-t border-slate-100 mt-2">
                {application.jobDescription ? (
                  <button
                    type="button"
                    onClick={() => handleAnalyzeResumeMatch()}
                    disabled={isAnalyzingMatch}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 hover:border-indigo-500 bg-indigo-50 hover:bg-indigo-100/60 py-2.5 text-xs font-extrabold text-indigo-700 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
                  >
                    <span>{isAnalyzingMatch ? "Analyzing Match..." : "Analyze ATS Resume Match 🤖"}</span>
                    <Sparkles size={11} className={isAnalyzingMatch ? "animate-spin" : ""} />
                  </button>
                ) : (
                  <div className="text-[10px] text-amber-600 bg-amber-50/50 border border-amber-100/65 rounded-xl p-2.5 leading-normal">
                    Please paste the Job Description first in the Research card tabs to enable AI Resume Matching analysis.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reminders Manager */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar size={16} className="text-indigo-655" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Follow-up & Reminders</h3>
            </div>

            {/* List reminders */}
            <div className="space-y-2.5">
              {(application.reminders || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No reminders set for this job.</p>
              ) : (
                (application.reminders || []).map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between text-xs bg-slate-50/50 border border-slate-200/60 p-2.5 rounded-xl shadow-3xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rem.isCompleted}
                        onChange={() => handleToggleReminder(rem.id, rem.isCompleted)}
                        className="rounded border-slate-355 bg-white text-indigo-600 focus:ring-indigo-500/20 h-4.5 w-4.5 cursor-pointer shadow-3xs"
                      />
                      <span className={`font-bold ${rem.isCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-700'}`}>
                        {rem.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      {new Date(rem.remindAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add reminder Form */}
            <form onSubmit={handleAddReminderSubmit} className="space-y-3 pt-4 border-t border-slate-100">
              <Select
                id="reminderType"
                label="Action Event"
                options={[
                  { value: 'FOLLOW_UP', label: 'Follow up' },
                  { value: 'INTERVIEW', label: 'Interview Calendar' },
                  { value: 'DEADLINE', label: 'Deadline' },
                ]}
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
                className="bg-white border-slate-200"
              />
              <Input
                id="reminderDate"
                label="Notify Date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                required
                className="bg-white border-slate-200"
              />
              <Button type="submit" size="sm" className="w-full shadow-2xs">Create Reminder</Button>
            </form>
          </div>

        </div>

      </div>

      {/* Edit Details Modal including Salary Fields */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Job Details">
        <form onSubmit={handleUpdateDetails} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="editCompany"
              label="Company Name"
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              required
            />
            <Input
              id="editRole"
              label="Role Title"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="editType"
              label="Job Type"
              options={[
                { value: 'FULL_TIME', label: 'Full Time' },
                { value: 'INTERNSHIP', label: 'Internship' },
                { value: 'FREELANCE', label: 'Freelance' },
                { value: 'CONTRACT', label: 'Contract' },
                { value: 'OTHER', label: 'Other' },
              ]}
              value={editType}
              onChange={(e) => setEditType(e.target.value as JobType)}
            />

            <Select
              id="editPlatform"
              label="Source Platform"
              options={[
                { value: 'LINKEDIN', label: 'LinkedIn' },
                { value: 'INDEED', label: 'Indeed' },
                { value: 'UPWORK', label: 'Upwork' },
                { value: 'REFERRAL', label: 'Referral' },
                { value: 'COMPANY_WEBSITE', label: 'Company Website' },
                { value: 'OTHER', label: 'Other' },
              ]}
              value={editPlatform}
              onChange={(e) => setEditPlatform(e.target.value as SourcePlatform)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="editLocation"
              label="Location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />

            <Input
              id="editUrl"
              label="Job Post URL"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
            />
          </div>

          {/* Salary Fields */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
            <Input
              id="editSalaryMin"
              label="Min Salary"
              type="number"
              value={editSalaryMin}
              onChange={(e) => setEditSalaryMin(e.target.value)}
            />
            <Input
              id="editSalaryMax"
              label="Max Salary"
              type="number"
              value={editSalaryMax}
              onChange={(e) => setEditSalaryMax(e.target.value)}
            />
            <Select
              id="editSalaryCurrency"
              label="Currency"
              options={[
                { value: 'IDR', label: 'IDR (Rp)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'SGD', label: 'SGD (S$)' },
                { value: 'GBP', label: 'GBP (£)' }
              ]}
              value={editSalaryCurrency}
              onChange={(e) => setEditSalaryCurrency(e.target.value)}
            />
          </div>
          
          <Input
            id="editBenefits"
            label="Benefits / Allowances Description"
            placeholder="e.g. WFH setup allowance, Health Insurance, Yearly bonus, MacBook Pro..."
            value={editBenefits}
            onChange={(e) => setEditBenefits(e.target.value)}
          />

          <div className="flex items-center gap-4 py-2 border-t border-slate-150 mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0">
              {editLogo ? (
                <img src={editLogo} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <BriefcaseIcon size={16} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-slate-700">Company Logo (Optional)</p>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {editLogo && (
                  <button
                    type="button"
                    onClick={() => setEditLogo("")}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Pipeline Stage Modal */}
      <Modal isOpen={isStageModalOpen} onClose={() => setIsStageModalOpen(false)} title="Update Pipeline Stage">
        <form onSubmit={handleStageChangeSubmit} className="space-y-4">
          <Select
            id="nextStage"
            label="New Pipeline Stage"
            options={[
              { value: 'WATCHING', label: 'Watching (Saved)' },
              { value: 'PREPARED', label: 'Prepared (Resume details ready)' },
              { value: 'APPLIED', label: 'Applied' },
              { value: 'HR_SCREENING', label: 'HR Screening' },
              { value: 'INTERVIEW_1', label: 'Interview Stage 1' },
              { value: 'INTERVIEW_2', label: 'Interview Stage 2' },
              { value: 'REVIEW', label: 'In Review' },
              { value: 'OFFER', label: 'Offer Received' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
            value={nextStage}
            onChange={(e) => setNextStage(e.target.value as StageType)}
          />

          <Textarea
            id="stageNote"
            label="Transition Notes"
            placeholder="Add comments on why it moved, key feedback received, or interview prep details..."
            value={stageNote}
            onChange={(e) => setStageNote(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsStageModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Log Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Application">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 leading-relaxed">
            Are you sure you want to delete this job application? This action is permanent and will delete all associated stages, notes, and reminders.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteAppConfirm} className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 hover:border-rose-700">
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Associated Resume PDF Preview Modal */}
      <Modal 
        isOpen={isResumePreviewOpen} 
        onClose={() => setIsResumePreviewOpen(false)} 
        title={`Preview: ${selectedResume?.title || 'Resume'}`}
      >
        <div className="w-full h-[60vh] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
          {resumeBlobUrl ? (
            <iframe src={resumeBlobUrl} className="w-full h-full border-0" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              Loading PDF viewer...
            </div>
          )}
        </div>
      </Modal>

      {/* AI Resume Match Analysis Modal */}
      <Modal 
        isOpen={isMatchModalOpen} 
        onClose={() => setIsMatchModalOpen(false)} 
        title="AI ATS Resume Compatibility"
        className="max-w-2xl"
      >
        {matchAnalysis && (
          <div className="space-y-6">
            
            {/* Glowing Radial / Circular Dial panel */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-150 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-center text-white shadow-md">
              {/* Radial ambient background colors based on score */}
              {matchAnalysis.score >= 80 ? (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-emerald-500/15 blur-2xl animate-pulse" />
              ) : matchAnalysis.score >= 50 ? (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-amber-500/15 blur-2xl animate-pulse" />
              ) : (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-rose-500/15 blur-2xl animate-pulse" />
              )}

              <div className="relative space-y-2">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300 block select-none">
                  🚀 ATS Fit Index
                </span>
                
                {/* Visual score display */}
                <div className="flex justify-center items-center py-2 select-none">
                  <div className={`h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center shadow-lg ${
                    matchAnalysis.score >= 80 ? "border-emerald-500 bg-emerald-950/20 text-emerald-400" :
                    matchAnalysis.score >= 50 ? "border-amber-500 bg-amber-950/20 text-amber-400" :
                    "border-rose-500 bg-rose-950/20 text-rose-400"
                  }`}>
                    <span className="text-3xl font-black leading-none">{matchAnalysis.score}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">% Match</span>
                  </div>
                </div>

                <h4 className="text-sm font-extrabold tracking-wide">
                  {matchAnalysis.score >= 80 ? "Strong Candidate Overlap" :
                   matchAnalysis.score >= 50 ? "Good Potential, Minor Tailoring Required" : "Significant Customization Recommended"}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {matchAnalysis.score >= 80 ? "Your CV template aligns exceptionally well with the criteria of this job opportunity." :
                   matchAnalysis.score >= 50 ? "You possess many of the required qualifications but adding missing keywords can boost response rates." :
                   "The technology stacks or experience items have notable gaps. Align your CV keywords to match the details."}
                </p>
              </div>
            </div>

            {/* Overlaps & Gaps side-by-side grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Overlapping Strengths */}
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/10 p-5 space-y-3">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-extrabold">✓</span>
                  <span>Matched Strengths</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {matchAnalysis.matchingSkills?.length > 0 ? (
                    matchAnalysis.matchingSkills.map((skill: string) => (
                      <span key={skill} className="text-[10px] font-bold bg-emerald-100/50 text-emerald-800 border border-emerald-200/50 px-2.5 py-1 rounded-xl">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No skills overlap detected.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills alert */}
              <div className="rounded-3xl border border-rose-100 bg-rose-50/10 p-5 space-y-3">
                <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <span className="h-4 w-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-[10px] font-bold">!</span>
                  <span>Skills Gaps</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {matchAnalysis.missingSkills?.length > 0 ? (
                    matchAnalysis.missingSkills.map((skill: string) => (
                      <span key={skill} className="text-[10px] font-bold bg-rose-100/50 text-rose-800 border border-rose-200/50 px-2.5 py-1 rounded-xl">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No major skill gaps identified.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper suggestions roadmaps */}
            <div className="border-t border-slate-150 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-indigo-850 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-650" />
                  <span>Resume Tailoring Roadmap</span>
                </h4>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                  Actionable Tips
                </span>
              </div>

              <div className="space-y-3">
                {matchAnalysis.suggestions?.map((sug: string, idx: number) => (
                  <div key={idx} className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-indigo-50/15 border border-indigo-100/40 hover:border-indigo-150/45 transition-colors">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-3xs select-none">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                      {sug}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Cache indications and refresh trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-150 mt-4 select-none">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>Result is cached locally in MySQL</span>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAnalyzeResumeMatch(true)}
                  disabled={isAnalyzingMatch}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-650 transition-colors bg-indigo-50 hover:bg-indigo-100/60 px-4 py-2 rounded-xl border border-indigo-150 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <span>Re-run AI Analysis 🔄</span>
                </button>
                <Button onClick={() => setIsMatchModalOpen(false)} size="sm">
                  Close Analysis
                </Button>
              </div>
            </div>

          </div>
        )}
      </Modal>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes pulse-ring-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-ring-red {
          animation: pulse-ring-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        /* Custom thin scrollbar */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        /* Animated stepper connector dashed line */
        @keyframes march {
          0% { background-position: 0 0; }
          100% { background-position: 12px 0; }
        }
        .inactive-dashed-line {
          background-image: linear-gradient(90deg, #e2e8f0 55%, transparent 45%);
          background-size: 12px 100%;
        }
        .animate-march {
          background-image: linear-gradient(90deg, #6366f1 55%, transparent 45%);
          background-size: 12px 100%;
          animation: march 0.6s linear infinite;
        }
        .animate-march-red {
          background-image: linear-gradient(90deg, #ef4444 55%, transparent 45%);
          background-size: 12px 100%;
          animation: march 0.6s linear infinite;
        }
      `}} />
    </div>
  );
}
