"use client";

import React, { useState, useEffect } from "react";
import { useApplicationStore, StageType, JobType, SourcePlatform } from "@/store/application.store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import { Briefcase as BriefcaseIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const { addApplication, isLoading } = useApplicationStore();

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyFounded, setCompanyFounded] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobType, setJobType] = useState<JobType>("FULL_TIME");
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>("LINKEDIN");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [currentStage, setCurrentStage] = useState<StageType>("WATCHING");
  const [formError, setFormError] = useState<string | null>(null);

  // Salary Tracker Form States
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("IDR");
  const [benefits, setBenefits] = useState("");

  // AI Autofill States
  const [aiJdText, setAiJdText] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);

  // Autocomplete states
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/applications/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (e) {
      console.error("Error fetching companies:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (value.trim() === "") {
      setFilteredCompanies([]);
    } else {
      const filtered = companies.filter((c) =>
        c.companyName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  };

  const handleSelectCompany = (c: any) => {
    setCompanyName(c.companyName);
    if (c.location) setLocation(c.location);
    if (c.companyLogo) setCompanyLogo(c.companyLogo);
    setCompanyWebsite(c.companyWebsite || "");
    setCompanyIndustry(c.companyIndustry || "");
    setCompanyDescription(c.companyDescription || "");
    setCompanyFounded(c.companyFounded || "");
    setShowSuggestions(false);
  };

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
      if (!rawDataUrl) {
        toast.error("Failed to read file.");
        return;
      }

      try {
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 128;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              setCompanyLogo(canvas.toDataURL("image/png"));
            } else {
              setCompanyLogo(rawDataUrl);
            }
          } catch {
            setCompanyLogo(rawDataUrl);
          }
        };
        img.onerror = () => {
          setCompanyLogo(rawDataUrl);
        };
        img.src = rawDataUrl;
      } catch {
        setCompanyLogo(rawDataUrl);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAiAutofill = async () => {
    if (!aiJdText.trim()) {
      toast.error("Please paste job description details first.");
      return;
    }
    setIsAutofilling(true);
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiJdText }),
      });
      
      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        if (data) {
          if (data.companyName) handleCompanyNameChange(data.companyName);
          if (data.roleTitle) setRoleTitle(data.roleTitle);
          if (data.jobType) setJobType(data.jobType);
          if (data.sourcePlatform) setSourcePlatform(data.sourcePlatform);
          if (data.location) setLocation(data.location);
          if (data.salaryMin) setSalaryMin(String(data.salaryMin));
          if (data.salaryMax) setSalaryMax(String(data.salaryMax));
          if (data.salaryCurrency) setSalaryCurrency(data.salaryCurrency);
          if (data.benefits) setBenefits(data.benefits);
          if (data.companyLogo) setCompanyLogo(data.companyLogo);
          if (data.companyWebsite) setCompanyWebsite(data.companyWebsite);
          if (data.companyIndustry) setCompanyIndustry(data.companyIndustry);
          if (data.companyDescription) setCompanyDescription(data.companyDescription);
          toast.success("AI successfully parsed and auto-populated the form fields!");
        }
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to parse description using AI.");
      }
    } catch (e) {
      toast.error("Network error. Failed to run AI auto-fill.");
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleCloseAddModal = () => {
    setCompanyName("");
    setCompanyLogo("");
    setCompanyWebsite("");
    setCompanyIndustry("");
    setCompanyDescription("");
    setCompanyFounded("");
    setRoleTitle("");
    setLocation("");
    setJobUrl("");
    setCurrentStage("WATCHING");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("IDR");
    setBenefits("");
    setAiJdText("");
    setFormError(null);
    setFilteredCompanies([]);
    setShowSuggestions(false);
    onClose();
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName || !roleTitle) {
      setFormError("Company name and role title are required.");
      return;
    }

    const success = await addApplication({
      companyName,
      companyLogo: companyLogo || null,
      companyWebsite: companyWebsite || null,
      companyIndustry: companyIndustry || null,
      companyDescription: companyDescription || null,
      companyFounded: companyFounded || null,
      roleTitle,
      jobType,
      sourcePlatform,
      currentStage,
      location: location || null,
      jobUrl: jobUrl || null,
      resumeId: null,
      appliedAt:
        currentStage !== "WATCHING" && currentStage !== "PREPARED"
          ? new Date().toISOString()
          : null,
      // Salary Fields
      salaryMin: salaryMin !== "" ? Number(salaryMin) : null,
      salaryMax: salaryMax !== "" ? Number(salaryMax) : null,
      salaryCurrency: salaryCurrency,
      benefits: benefits || null,
      // Job Description Archiver
      jobDescription: aiJdText || null,
    });

    if (success) {
      handleCloseAddModal();
    } else {
      setFormError("Failed to add job application. Please check your database connection.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAddModal} title="Quick Add Job Opportunity">
      {formError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-medium text-rose-600">
          {formError}
        </div>
      )}
      <div className="space-y-4">
        {/* AI Autofill Section */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-3 shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1 select-none">
              <Sparkles size={11} className="animate-pulse" /> AI Smart Auto-Fill
            </span>
            {aiJdText.trim() && (
              <button
                type="button"
                onClick={() => setAiJdText("")}
                className="text-[9px] font-bold text-slate-400 hover:text-slate-650 uppercase"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            placeholder="Paste raw LinkedIn job description, email content, or requirements text here to auto-populate all forms via Gemini API..."
            value={aiJdText}
            onChange={(e) => setAiJdText(e.target.value)}
            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[70px] resize-y"
          />
          <button
            type="button"
            onClick={handleAiAutofill}
            disabled={isAutofilling}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 hover:border-indigo-500 bg-indigo-50 hover:bg-indigo-100/60 py-2.5 text-xs font-extrabold text-indigo-700 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
          >
            <span>Auto-populate Form fields</span>
            <Sparkles size={11} />
          </button>
        </div>

        <form onSubmit={handleQuickAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Input
                id="companyName"
                label="Company Name"
                placeholder="e.g. Google"
                value={companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
                autoComplete="off"
              />
              {showSuggestions && filteredCompanies.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {filteredCompanies.map((c) => (
                    <button
                      key={c.companyName}
                      type="button"
                      onMouseDown={() => handleSelectCompany(c)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                    >
                      <CompanyAvatar companyName={c.companyName} companyLogo={c.companyLogo} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-800">{c.companyName}</p>
                        {c.location && <p className="text-[10px] text-slate-400">{c.location}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input
              id="roleTitle"
              label="Role Title"
              placeholder="e.g. Software Engineer"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="jobType"
              label="Job Type"
              options={[
                { value: "FULL_TIME", label: "Full Time" },
                { value: "INTERNSHIP", label: "Internship" },
                { value: "FREELANCE", label: "Freelance" },
                { value: "CONTRACT", label: "Contract" },
                { value: "OTHER", label: "Other" },
              ]}
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
            />

            <Select
              id="sourcePlatform"
              label="Source Channel"
              options={[
                { value: "LINKEDIN", label: "LinkedIn" },
                { value: "INDEED", label: "Indeed" },
                { value: "UPWORK", label: "Upwork" },
                { value: "REFERRAL", label: "Referral" },
                { value: "COMPANY_WEBSITE", label: "Company Website" },
                { value: "OTHER", label: "Other" },
              ]}
              value={sourcePlatform}
              onChange={(e) => setSourcePlatform(e.target.value as SourcePlatform)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="location"
              label="Location"
              placeholder="e.g. Mountain View, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <Input
              id="jobUrl"
              label="Job Posting URL"
              placeholder="https://..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
          </div>

          <Select
            id="currentStage"
            label="Initial Pipeline Stage"
            options={[
              { value: "WATCHING", label: "Watching (Saved for later)" },
              { value: "PREPARED", label: "Prepared (Resume ready)" },
              { value: "APPLIED", label: "Applied" },
              { value: "HR_SCREENING", label: "HR Screening" },
              { value: "INTERVIEW_1", label: "Interview Stage 1" },
              { value: "INTERVIEW_2", label: "Interview Stage 2" },
              { value: "REVIEW", label: "In Review" },
              { value: "OFFER", label: "Offer Received" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            value={currentStage}
            onChange={(e) => setCurrentStage(e.target.value as StageType)}
          />

          {/* Salary Tracker Form inputs */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
            <Input
              id="salaryMin"
              label="Min Salary"
              type="number"
              placeholder="e.g. 10000000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
            <Input
              id="salaryMax"
              label="Max Salary"
              type="number"
              placeholder="e.g. 15000000"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
            <Select
              id="salaryCurrency"
              label="Currency"
              options={[
                { value: "IDR", label: "IDR (Rp)" },
                { value: "USD", label: "USD ($)" },
                { value: "EUR", label: "EUR (€)" },
                { value: "SGD", label: "SGD (S$)" },
                { value: "GBP", label: "GBP (£)" }
              ]}
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value)}
            />
          </div>

          <Input
            id="benefits"
            label="Benefits / Allowances Details"
            placeholder="e.g. Health Insurance, WFH Setup, laptop..."
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
          />

          <div className="flex items-center gap-4 py-2 border-t border-slate-100 mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <BriefcaseIcon size={16} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-slate-700">Company Logo (Optional)</p>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors">
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {companyLogo && (
                  <button
                    type="button"
                    onClick={() => setCompanyLogo("")}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Opportunity
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
