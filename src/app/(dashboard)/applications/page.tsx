"use client";

import React, { useEffect, useState } from "react";
import { useApplicationStore, StageType, JobApplication } from "@/store/application.store";
import { stageColors } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import {
  Search,
  Download,
  ExternalLink,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const colorMap: Record<string, { indicator: string }> = {
  indigo: { indicator: "bg-slate-400" },
  rose: { indicator: "bg-rose-500" },
  amber: { indicator: "bg-amber-500" },
  emerald: { indicator: "bg-emerald-500" },
  sky: { indicator: "bg-sky-500" },
  purple: { indicator: "bg-purple-500" },
  teal: { indicator: "bg-teal-500" },
  orange: { indicator: "bg-orange-500" },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const {
    applications,
    fetchApplications,
    deleteApplication,
    deleteApplicationsBulk,
    isLoading,
  } = useApplicationStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("updatedAt_desc");

  // Selection states
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Deletion modals state
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Reset selection & page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedAppIds([]);
  }, [searchTerm, stageFilter, typeFilter]);

  // Reset selection when page changes
  useEffect(() => {
    setSelectedAppIds([]);
  }, [currentPage]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click navigation
    setDeleteConfirmAppId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmAppId) {
      const success = await deleteApplication(deleteConfirmAppId);
      if (success) {
        toast.success("Opportunity deleted successfully");
      }
      setDeleteConfirmAppId(null);
    }
  };

  // Filter and Sort applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStage = stageFilter === "ALL" || app.currentStage === stageFilter;
    const matchesType = typeFilter === "ALL" || app.jobType === typeFilter;

    return matchesSearch && matchesStage && matchesType;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    const [field, direction] = sortBy.split("_");
    const multiplier = direction === "asc" ? 1 : -1;

    const valA = a[field as keyof JobApplication] as any;
    const valB = b[field as keyof JobApplication] as any;

    if (valA === null || valA === undefined) return direction === "asc" ? 1 : -1;
    if (valB === null || valB === undefined) return direction === "asc" ? -1 : 1;

    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB) * multiplier;
    }

    // date comparison
    return (new Date(valA).getTime() - new Date(valB).getTime()) * multiplier;
  });

  const totalPages = Math.ceil(sortedApps.length / itemsPerPage);
  const paginatedApps = sortedApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Select all handlers
  const isAllSelected = paginatedApps.length > 0 && paginatedApps.every((app) => selectedAppIds.includes(app.id));
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAllSelected) {
      const pageIds = paginatedApps.map((a) => a.id);
      setSelectedAppIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedApps.map((a) => a.id);
      setSelectedAppIds((prev) => {
        const next = [...prev];
        pageIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedAppIds.length > 0) {
      const success = await deleteApplicationsBulk(selectedAppIds);
      if (success) {
        toast.success(`${selectedAppIds.length} opportunities deleted successfully!`);
        setSelectedAppIds([]);
      } else {
        toast.error("Failed to delete selected opportunities");
      }
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = [
      "Company Name",
      "Role Title",
      "Job Type",
      "Location",
      "Platform",
      "Current Stage",
      "Date Applied",
      "Date Saved",
    ];
    const rows = sortedApps.map((app) => [
      `"${app.companyName.replace(/"/g, '""')}"`,
      `"${app.roleTitle.replace(/"/g, '""')}"`,
      app.jobType,
      `"${(app.location || "").replace(/"/g, '""')}"`,
      app.sourcePlatform,
      app.currentStage,
      app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A",
      new Date(app.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `jobtrack_applications_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Showing {sortedApps.length} of {applications.length} total opportunities.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="gap-2 shrink-0 shadow-2xs"
            disabled={sortedApps.length === 0}
          >
            <Download size={15} /> Export CSV
          </Button>
          <Link href="/">
            <Button className="gap-2 shadow-2xs">
              <Plus size={15} /> Add Opportunity
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedAppIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-150/45 rounded-2xl animate-fade-in select-none">
          <span className="text-xs font-bold text-indigo-900">
            Selected <span className="font-extrabold text-indigo-750">{selectedAppIds.length}</span> opportunities
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedAppIds([])}
              className="text-xs font-bold text-slate-650 hover:text-slate-800 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-650 hover:bg-rose-750 px-4 py-2 rounded-xl border border-rose-600 transition-colors cursor-pointer shadow-3xs"
            >
              <Trash2 size={12} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="surface-card flex flex-col items-center justify-between gap-4 rounded-3xl p-5 md:flex-row border border-slate-150/40">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search company, role, location..."
            className="glass-input w-full py-2.5 pl-9 pr-4 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Stage</span>
            <select
              className="glass-input px-3 py-2 text-sm shrink-0"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="ALL">All Stages</option>
              <option value="WATCHING">Watching</option>
              <option value="PREPARED">Prepared</option>
              <option value="APPLIED">Applied</option>
              <option value="HR_SCREENING">HR Screening</option>
              <option value="INTERVIEW_1">Interview 1</option>
              <option value="INTERVIEW_2">Interview 2</option>
              <option value="REVIEW">Review</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Type</span>
            <select
              className="glass-input px-3 py-2 text-sm shrink-0"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="FREELANCE">Freelance</option>
              <option value="CONTRACT">Contract</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Sort</span>
            <select
              className="glass-input px-3 py-2 text-sm shrink-0"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt_desc">Last Updated</option>
              <option value="createdAt_desc">Date Created</option>
              <option value="companyName_asc">Company (A-Z)</option>
              <option value="roleTitle_asc">Role (A-Z)</option>
              <option value="appliedAt_desc">Date Applied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spaced Card-Row List Layout */}
      <div className="space-y-3.5">
        {/* Table header for desktop */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400 bg-slate-50/70 border border-slate-200/50 rounded-2xl items-center select-none">
          <div className="col-span-1 flex items-center pl-1">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="h-4.5 w-4.5 rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
          </div>
          <div className="col-span-3">Company & Role</div>
          <div className="col-span-2">Job Type</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Stage</div>
          <div className="col-span-1">Channel</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="surface-card p-12 text-center font-medium text-slate-500 rounded-3xl border border-slate-150/40">
            <svg className="animate-spin h-6 w-6 text-indigo-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading applications...
          </div>
        ) : sortedApps.length === 0 ? (
          <div className="surface-card p-12 text-center text-slate-500 rounded-3xl border border-slate-150/40 flex flex-col items-center justify-center space-y-3">
            <Search size={32} className="text-slate-300" />
            <div>
              <p className="font-semibold text-slate-700">No results found</p>
              <p className="text-xs text-slate-400 mt-1">Try refining your search terms or filters.</p>
            </div>
            {(searchTerm || stageFilter !== "ALL" || typeFilter !== "ALL") && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStageFilter("ALL");
                  setTypeFilter("ALL");
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          paginatedApps.map((app) => {
            const cardStyles = colorMap[app.cardColor || "indigo"] || colorMap.indigo;
            const stageStyle = (stageColors[app.currentStage] || stageColors.WATCHING).badge;

            return (
              <div
                key={app.id}
                onClick={() => router.push(`/applications/${app.id}`)}
                className="grid grid-cols-6 md:grid-cols-12 gap-3.5 items-center px-6 py-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-indigo-200/80 hover:scale-[1.003] transition-all duration-200 cursor-pointer relative overflow-hidden group"
              >
                {/* Visual left indicator matching chosen color */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cardStyles.indicator}`} />

                {/* Selection Checkbox */}
                <div className="col-span-1 flex items-center pl-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedAppIds.includes(app.id)}
                    onChange={() => {
                      setSelectedAppIds((prev) =>
                        prev.includes(app.id) ? prev.filter((id) => id !== app.id) : [...prev, app.id]
                      );
                    }}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Company & Role */}
                <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                  <CompanyAvatar companyName={app.companyName} companyLogo={app.companyLogo} size="md" className="shadow-2xs" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                      {app.companyName}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {app.roleTitle}
                    </p>
                  </div>
                </div>

                {/* Job Type Badge (Hidden on mobile) */}
                <div className="col-span-2 hidden md:block">
                  <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {app.jobType.replace("_", " ")}
                  </span>
                </div>

                {/* Location (Hidden on mobile) */}
                <div className="col-span-2 hidden md:block text-sm font-semibold text-slate-600 truncate">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{app.location || "Remote/N/A"}</span>
                  </span>
                </div>

                {/* Stage Badge */}
                <div className="col-span-2">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] ${stageStyle}`}>
                    {app.currentStage.replace("_", " ")}
                  </span>
                </div>

                {/* Source Platform (Hidden on mobile) */}
                <div className="col-span-1 hidden md:block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  {app.sourcePlatform.slice(0, 3)}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-450 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-3xs"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={(e) => handleDeleteClick(app.id, e)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-455 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-3xs cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-slate-200/80 bg-white px-6 py-4 rounded-2xl shadow-2xs select-none">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-bold text-slate-700">
                  {Math.min(currentPage * itemsPerPage, sortedApps.length)}
                </span>{" "}
                of <span className="font-bold text-slate-700">{sortedApps.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-3xs" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center rounded-l-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-450 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`inline-flex items-center border px-3.5 py-1.5 text-xs font-extrabold transition-colors cursor-pointer ${
                        isCurrent
                          ? "z-10 border-indigo-600 bg-indigo-50 text-indigo-750"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center rounded-r-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-455 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Single Opportunity Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmAppId !== null}
        onClose={() => setDeleteConfirmAppId(null)}
        title="Delete Job Application"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Are you sure you want to delete this job application? This action is permanent and will delete all associated stages, notes, and reminders.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmAppId(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 hover:border-rose-700">
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Bulk Delete Job Applications"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 flex gap-2 text-rose-750 text-xs leading-relaxed font-semibold">
            <span className="text-base select-none">⚠️</span>
            <div>
              Tindakan ini tidak bisa dibatalkan! Semua data lampiran, catatan, reminder, kontak, dan history tahap seleksi untuk <span className="font-extrabold text-rose-900">{selectedAppIds.length} lamaran</span> terpilih akan dihapus permanen.
            </div>
          </div>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Apakah Anda yakin ingin menghapus seluruh lamaran yang telah dipilih?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsBulkDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBulkDelete} className="bg-rose-650 hover:bg-rose-750 text-white border-rose-600 hover:border-rose-700 shadow-3xs">
              Delete Selected Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
