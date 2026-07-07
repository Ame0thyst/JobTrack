'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApplicationStore, StageType } from '@/store/application.store';
import { CompanyAvatar } from '@/components/ui/CompanyAvatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  ChevronRight, 
  Search, 
  ExternalLink,
  Calendar,
  Globe,
  Tag,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface CompanyGroup {
  companyName: string;
  companyLogo: string | null;
  location: string | null;
  companyWebsite: string | null;
  companyIndustry: string | null;
  companyDescription: string | null;
  companyFounded: string | null;
  applications: any[];
}

export default function CompaniesPage() {
  const { applications, fetchApplications, isLoading } = useApplicationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLogo, setEditLogo] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editFounded, setEditFounded] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchApplications();
    setMounted(true);
  }, [fetchApplications]);

  // Group applications by company name (normalized case-insensitively)
  const companyGroupsMap = new Map<string, CompanyGroup>();

  // Sort applications by date so that the latest data represents the company
  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  sortedApps.forEach((app) => {
    const key = app.companyName.trim().toLowerCase();
    if (!companyGroupsMap.has(key)) {
      companyGroupsMap.set(key, {
        companyName: app.companyName.trim(),
        companyLogo: app.companyLogo,
        location: app.location,
        companyWebsite: app.companyWebsite,
        companyIndustry: app.companyIndustry,
        companyDescription: app.companyDescription,
        companyFounded: app.companyFounded,
        applications: [],
      });
    }
    companyGroupsMap.get(key)!.applications.push(app);
  });

  const companyGroups = Array.from(companyGroupsMap.values());

  // Filter companies based on search
  const filteredCompanies = companyGroups.filter((group) => {
    const matchName = group.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLocation = (group.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchLocation;
  });

  // Auto-select the first company if none is selected
  useEffect(() => {
    if (!selectedCompanyName && filteredCompanies.length > 0) {
      setSelectedCompanyName(filteredCompanies[0].companyName);
    }
  }, [filteredCompanies, selectedCompanyName]);

  const selectedGroup = companyGroups.find(
    (g) => g.companyName.toLowerCase() === selectedCompanyName?.toLowerCase()
  );

  // Initialize edit fields only when the modal is opened
  useEffect(() => {
    if (selectedGroup && isEditModalOpen) {
      setEditLogo(selectedGroup.companyLogo || '');
      setEditLocation(selectedGroup.location || '');
      setEditWebsite(selectedGroup.companyWebsite || '');
      setEditIndustry(selectedGroup.companyIndustry || '');
      setEditFounded(selectedGroup.companyFounded || '');
      setEditDescription(selectedGroup.companyDescription || '');
      setSaveError(null);
    }
  }, [isEditModalOpen]);

  const getStageColor = (stage: StageType) => {
    switch (stage) {
      case 'WATCHING': return 'text-slate-600 bg-slate-100 border-slate-200';
      case 'PREPARED': return 'text-indigo-700 bg-indigo-50 border-indigo-100';
      case 'APPLIED': return 'text-sky-700 bg-sky-50 border-sky-100';
      case 'HR_SCREENING': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'INTERVIEW_1': 
      case 'INTERVIEW_2': return 'text-violet-700 bg-violet-50 border-violet-100';
      case 'REVIEW': return 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100';
      case 'OFFER': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'REJECTED': return 'text-rose-700 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getCompanyStatusIndicator = (group: CompanyGroup) => {
    const hasOffer = group.applications.some(a => a.currentStage === 'OFFER');
    const hasInterview = group.applications.some(a => 
      ['HR_SCREENING', 'INTERVIEW_1', 'INTERVIEW_2', 'REVIEW'].includes(a.currentStage)
    );
    const hasActive = group.applications.some(a => 
      ['APPLIED', 'PREPARED'].includes(a.currentStage)
    );

    if (hasOffer) return { color: 'bg-emerald-500', label: 'Offer Received' };
    if (hasInterview) return { color: 'bg-violet-500', label: 'Interviewing' };
    if (hasActive) return { color: 'bg-sky-500', label: 'Active Application' };
    return { color: 'bg-slate-400', label: 'No Active Opportunities' };
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        alert("Failed to read file.");
        return;
      }

      // Try canvas compression for smaller payload
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
              const dataUrl = canvas.toDataURL("image/png");
              setEditLogo(dataUrl);
            } else {
              // Canvas context unavailable, use raw data URL
              setEditLogo(rawDataUrl);
            }
          } catch {
            // Canvas compression failed, use raw data URL
            setEditLogo(rawDataUrl);
          }
        };
        img.onerror = () => {
          // Image decode failed, use raw data URL directly
          setEditLogo(rawDataUrl);
        };
        img.src = rawDataUrl;
      } catch {
        // Fallback: use raw data URL without compression
        setEditLogo(rawDataUrl);
      }
    };
    reader.onerror = () => {
      alert("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be re-selected
    e.target.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/applications/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: selectedGroup.companyName,
          companyLogo: editLogo || null,
          location: editLocation || null,
          companyWebsite: editWebsite || null,
          companyIndustry: editIndustry || null,
          companyDescription: editDescription || null,
          companyFounded: editFounded || null,
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        await fetchApplications();
      } else {
        const err = await res.json();
        setSaveError(err.message || 'Failed to update company profile');
      }
    } catch (err) {
      setSaveError('Network error. Failed to save company profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">
            View status summaries, profile directories, and historical timelines per organization.
          </p>
        </div>
      </div>

      {/* Main Master-Detail Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Side: Master List */}
        <div className="lg:col-span-4 flex flex-col space-y-4 h-full min-h-0">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search companies or locations..."
              className="glass-input w-full py-2.5 pl-9 pr-4 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading && companyGroups.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-medium">
                <svg className="animate-spin h-5 w-5 text-indigo-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading directory...
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="surface-card rounded-2xl p-6 text-center text-slate-500 border border-slate-200/80">
                <Building2 size={24} className="mx-auto mb-2 text-slate-350" />
                <p className="text-xs font-semibold text-slate-800">No companies found</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              filteredCompanies.map((group) => {
                const isSelected = selectedCompanyName?.toLowerCase() === group.companyName.toLowerCase();
                const indicator = getCompanyStatusIndicator(group);
                return (
                  <button
                    key={group.companyName}
                    onClick={() => setSelectedCompanyName(group.companyName)}
                    className={`surface-card w-full text-left flex items-center justify-between rounded-2xl p-4 transition-all duration-200 border cursor-pointer hover:translate-x-0.5 ${
                      isSelected 
                        ? 'border-indigo-200 bg-indigo-50/20 shadow-md' 
                        : 'border-slate-200/80 hover:border-indigo-150 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyAvatar companyName={group.companyName} companyLogo={group.companyLogo} size="md" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{group.companyName}</h4>
                        {group.location && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 truncate">
                            <MapPin size={9} />
                            <span>{group.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                      <span className="rounded-xl border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {group.applications.length} {group.applications.length === 1 ? 'Job' : 'Jobs'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${indicator.color}`} />
                        <span className="text-[9px] font-semibold text-slate-400">{indicator.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detail Pane */}
        <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
          {!selectedGroup ? (
            <div className="surface-card flex-1 flex flex-col items-center justify-center rounded-3xl p-8 text-center border border-slate-200/80">
              <Building2 size={48} className="text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800">Select a Company</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Choose an organization from the directory list on the left to see profile statistics and historical logs.
              </p>
            </div>
          ) : (
            <div className="surface-card flex-1 flex flex-col rounded-3xl border border-slate-200/80 overflow-hidden">
              
              {/* Profile Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/40 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CompanyAvatar 
                      companyName={selectedGroup.companyName} 
                      companyLogo={selectedGroup.companyLogo} 
                      size="lg" 
                      className="h-14 w-14 rounded-2xl" 
                    />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedGroup.companyName}</h2>
                      {selectedGroup.location && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <MapPin size={11} />
                          <span>{selectedGroup.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="gap-1.5 text-xs">
                      <Edit3 size={13} /> Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Extended Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100/80 text-xs">
                  <div>
                    <span className="text-slate-400 flex items-center gap-1"><Tag size={12} /> Industry</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {selectedGroup.companyIndustry || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 flex items-center gap-1"><Calendar size={12} /> Founded</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {selectedGroup.companyFounded || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 flex items-center gap-1"><Globe size={12} /> Website</span>
                    {selectedGroup.companyWebsite ? (
                      <a 
                        href={selectedGroup.companyWebsite.startsWith('http') ? selectedGroup.companyWebsite : `https://${selectedGroup.companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-indigo-750 hover:underline mt-1 flex items-center gap-1"
                      >
                        Visit Site <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="font-bold text-slate-400 mt-1 block">Not set</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 flex items-center gap-1"><Briefcase size={12} /> Opportunities</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {selectedGroup.applications.length} Active roles
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* About Company Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider block">About Company</h3>
                  <div className="p-4 rounded-2xl bg-slate-50/40 border border-slate-150 text-xs text-slate-650 leading-relaxed">
                    {selectedGroup.companyDescription ? (
                      <p className="whitespace-pre-wrap">{selectedGroup.companyDescription}</p>
                    ) : (
                      <p className="italic text-slate-400">No profile description added yet. Click 'Edit Profile' to add company branches, business sectors, or background information.</p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Job Application History</h3>
                  
                  <div className="relative border-l border-slate-200 pl-6 ml-2.5 space-y-6">
                    {selectedGroup.applications.map((app) => {
                      const indicator = getStageColor(app.currentStage);
                      return (
                        <div key={app.id} className="relative group/timeline">
                          <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300 ring-2 ring-transparent transition-all group-hover/timeline:bg-indigo-650 group-hover/timeline:ring-indigo-100" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-2xl border border-slate-150 bg-white shadow-sm hover:shadow transition-all duration-200">
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-bold text-slate-900 group-hover/timeline:text-indigo-750 transition-colors">
                                {app.roleTitle}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-550">
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">
                                  {app.jobType.replace('_', ' ')}
                                </span>
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">
                                  {app.sourcePlatform}
                                </span>
                                <span className="flex items-center gap-1 ml-1 text-slate-400">
                                  <Calendar size={10} />
                                  {mounted ? new Date(app.createdAt).toLocaleDateString() : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${indicator}`}>
                                {app.currentStage.replace('_', ' ')}
                              </span>
                              
                              <Link href={`/applications/${app.id}`}>
                                <button className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-750 shadow-sm cursor-pointer">
                                  Details <ChevronRight size={12} />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Edit Company Profile Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={`Edit Profile: ${selectedGroup?.companyName}`}
      >
        {saveError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-600">
            {saveError}
          </div>
        )}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="editLocation"
              label="Headquarters / Location"
              placeholder="e.g. San Francisco, CA or Jakarta"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
            <Input
              id="editWebsite"
              label="Website URL"
              placeholder="e.g. www.google.com"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="editIndustry"
              label="Industry / Sector"
              placeholder="e.g. Technology, FinTech"
              value={editIndustry}
              onChange={(e) => setEditIndustry(e.target.value)}
            />
            <Input
              id="editFounded"
              label="Founded Year"
              placeholder="e.g. 1998"
              value={editFounded}
              onChange={(e) => setEditFounded(e.target.value)}
            />
          </div>

          <Textarea
            id="editDescription"
            label="Company Description"
            placeholder="Brief details about what the company does, branch networks, or general insights..."
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={4}
          />

          <div className="flex items-center gap-4 py-2 border-t border-slate-150 mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0">
              {editLogo ? (
                <img src={editLogo} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <Briefcase size={16} className="text-slate-400" />
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
            <Button type="submit" isLoading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
