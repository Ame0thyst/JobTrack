"use client";

import React, { useEffect, useState } from "react";
import { useApplicationStore, StageType } from "@/store/application.store";
import { MapPin, MessageSquare, Eye, Search, ChevronLeft, ChevronRight, Palette, FileText, Calendar, Bell } from "lucide-react";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";
import Link from "next/link";

const colorMap: Record<string, {
  border: string;
  bg: string;
  badge: string;
  text: string;
  dot: string;
  label: string;
}> = {
  indigo: {
    border: 'border-t-4 border-t-slate-400 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-slate-50/50',
    badge: 'bg-slate-50 border-slate-100 text-slate-700',
    text: 'text-slate-800',
    dot: 'bg-slate-400',
    label: 'Slate/Default',
  },
  rose: {
    border: 'border-t-4 border-t-rose-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-rose-50/20',
    badge: 'bg-rose-50 border-rose-100 text-rose-700',
    text: 'text-rose-950',
    dot: 'bg-rose-500',
    label: 'Rose',
  },
  amber: {
    border: 'border-t-4 border-t-amber-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-amber-50/20',
    badge: 'bg-amber-50 border-amber-100 text-amber-700',
    text: 'text-amber-950',
    dot: 'bg-amber-500',
    label: 'Amber',
  },
  emerald: {
    border: 'border-t-4 border-t-emerald-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-emerald-50/20',
    badge: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    text: 'text-emerald-950',
    dot: 'bg-emerald-500',
    label: 'Emerald',
  },
  sky: {
    border: 'border-t-4 border-t-sky-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-sky-50/20',
    badge: 'bg-sky-50 border-sky-100 text-sky-700',
    text: 'text-sky-950',
    dot: 'bg-sky-500',
    label: 'Sky',
  },
  purple: {
    border: 'border-t-4 border-t-purple-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-purple-50/20',
    badge: 'bg-purple-50 border-purple-100 text-purple-700',
    text: 'text-purple-950',
    dot: 'bg-purple-500',
    label: 'Purple',
  },
  teal: {
    border: 'border-t-4 border-t-teal-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-teal-50/20',
    badge: 'bg-teal-50 border-teal-100 text-teal-700',
    text: 'text-teal-950',
    dot: 'bg-teal-500',
    label: 'Teal',
  },
  orange: {
    border: 'border-t-4 border-t-orange-500 border-b border-l border-r border-slate-200/90 shadow-sm',
    bg: 'bg-white hover:bg-orange-50/20',
    badge: 'bg-orange-50 border-orange-100 text-orange-700',
    text: 'text-orange-950',
    dot: 'bg-orange-500',
    label: 'Orange',
  },
};

export default function KanbanPage() {
  const { applications, fetchApplications, changeStage, updateApplication, isLoading } =
    useApplicationStore();
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Kanban Search and Collapse states
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Record<StageType, boolean>>({} as any);
  const [activeColorPickerAppId, setActiveColorPickerAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<StageType | null>(null);
  const [recentlyDroppedAppId, setRecentlyDroppedAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const toggleColumn = (stageType: StageType) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [stageType]: !prev[stageType],
    }));
  };

  const stages: { type: StageType; label: string; color: string }[] = [
    {
      type: "WATCHING",
      label: "Watching",
      color: "border-t-slate-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "PREPARED",
      label: "Prepared",
      color: "border-t-indigo-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "APPLIED",
      label: "Applied",
      color: "border-t-sky-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "HR_SCREENING",
      label: "HR Screening",
      color: "border-t-amber-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "INTERVIEW_1",
      label: "Interview 1",
      color: "border-t-purple-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "INTERVIEW_2",
      label: "Interview 2",
      color: "border-t-violet-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "REVIEW",
      label: "In Review",
      color: "border-t-fuchsia-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "OFFER",
      label: "Offer",
      color: "border-t-emerald-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
    {
      type: "REJECTED",
      label: "Rejected",
      color: "border-t-rose-400 bg-slate-100/50 border border-slate-200/80 shadow-sm backdrop-blur-sm",
    },
  ];

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    // Slight delay so the browser captures the active card (lifted & tilted) as drag image
    setTimeout(() => {
      setDraggedAppId(id);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: StageType) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (appId) {
      setRecentlyDroppedAppId(appId);
      await changeStage(appId, targetStage, `Dragged to ${targetStage}`);
      setDraggedAppId(null);
      setTimeout(() => {
        setRecentlyDroppedAppId(null);
      }, 700);
    }
  };

  // Filter applications by search term
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag and drop cards to move opportunities through each stage.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Filter by company, role, location..."
            className="glass-input w-full py-2.5 pl-9 pr-4 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 flex gap-4 items-stretch select-none">
        {isLoading && applications.length === 0 ? (
          <div className="m-auto text-slate-500 flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-indigo-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm font-semibold">
              Loading your Kanban pipeline...
            </p>
          </div>
        ) : (
          stages.map((stage) => {
            const stageApps = filteredApps.filter(
              (app) => app.currentStage === stage.type
            );
            const isCollapsed = !!collapsedColumns[stage.type];
            const isDragOver = dragOverStage === stage.type;

            return (
              <div
                key={stage.type}
                onDragOver={handleDragOver}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.type);
                }}
                onDragLeave={() => {
                  setDragOverStage(null);
                }}
                onDrop={async (e) => {
                  await handleDrop(e, stage.type);
                  setDragOverStage(null);
                }}
                className={`surface-card flex flex-col flex-shrink-0 overflow-hidden rounded-3xl border-t-4 transition-all duration-200 ${stage.color} ${
                  isCollapsed ? "w-14" : "w-72"
                } ${
                  isDragOver ? "bg-indigo-50/30 border-indigo-300 ring-2 ring-indigo-400/5 scale-[1.01]" : ""
                }`}
              >
                {isCollapsed ? (
                  /* Collapsed Column View */
                  <div className="flex flex-1 flex-col items-center justify-between py-4 px-2 h-full">
                    <button
                      onClick={() => toggleColumn(stage.type)}
                      className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-450 transition-all hover:border-slate-355 hover:text-indigo-600 shadow-sm cursor-pointer"
                      title="Expand column"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <div className="flex flex-1 items-center justify-center py-6 relative">
                      {/* Collapsed status dot */}
                      <span className={`absolute top-14 h-2 w-2 rounded-full ${
                        stage.type === 'WATCHING' ? 'bg-slate-400' :
                        stage.type === 'PREPARED' ? 'bg-indigo-500' :
                        stage.type === 'APPLIED' ? 'bg-sky-500' :
                        stage.type === 'HR_SCREENING' ? 'bg-amber-500' :
                        stage.type === 'INTERVIEW_1' ? 'bg-purple-500' :
                        stage.type === 'INTERVIEW_2' ? 'bg-violet-500' :
                        stage.type === 'REVIEW' ? 'bg-fuchsia-500' :
                        stage.type === 'OFFER' ? 'bg-emerald-500' :
                        'bg-rose-500'
                      }`} />
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap rotate-90 my-auto">
                        {stage.label}
                      </span>
                    </div>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-650">
                      {stageApps.length}
                    </span>
                  </div>
                ) : (
                  /* Expanded Column View */
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Colored indicator dot in Header */}
                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          stage.type === 'WATCHING' ? 'bg-slate-400' :
                          stage.type === 'PREPARED' ? 'bg-indigo-500' :
                          stage.type === 'APPLIED' ? 'bg-sky-500' :
                          stage.type === 'HR_SCREENING' ? 'bg-amber-500' :
                          stage.type === 'INTERVIEW_1' ? 'bg-purple-500' :
                          stage.type === 'INTERVIEW_2' ? 'bg-violet-500' :
                          stage.type === 'REVIEW' ? 'bg-fuchsia-500' :
                          stage.type === 'OFFER' ? 'bg-emerald-500' :
                          'bg-rose-500'
                        }`} />
                        <span className="truncate text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                          {stage.label}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-100 shadow-2xs">
                          {stageApps.length}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleColumn(stage.type)}
                        className="rounded-xl border border-slate-200 bg-white p-1 text-slate-455 transition-all hover:border-slate-355 hover:text-rose-600 shadow-sm cursor-pointer"
                        title="Collapse column"
                      >
                        <ChevronLeft size={12} />
                      </button>
                    </div>

                    <div className="flex-1 min-h-[150px] space-y-3 overflow-y-auto p-3">
                      {stageApps.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 py-8 text-[10px] font-medium text-slate-400">
                          Drop here
                        </div>
                      ) : (
                        stageApps.map((app) => {
                          const chosenColor = app.cardColor || 'indigo';
                          const colorStyles = colorMap[chosenColor] || colorMap.indigo;

                          const isDragging = draggedAppId === app.id;
                          const isRecentlyDropped = recentlyDroppedAppId === app.id;

                          return (
                            <div
                              key={app.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, app.id)}
                              onDragEnd={handleDragEnd}
                              className={`cursor-grab space-y-3 rounded-2xl p-3.5 relative group transition-all duration-300 ease-out active:cursor-grabbing active:scale-[1.025] active:rotate-[2.5deg] active:shadow-xl ${colorStyles.border} ${colorStyles.bg} ${
                                isDragging 
                                  ? "opacity-25 border-dashed scale-95 border-slate-350 shadow-none pointer-events-none" 
                                  : "hover:scale-[1.035] hover:-translate-y-0.5 hover:shadow-lg"
                              } ${
                                isRecentlyDropped ? "animate-drop-bounce" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <CompanyAvatar companyName={app.companyName} companyLogo={app.companyLogo} size="sm" className="mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-bold leading-tight text-slate-800">
                                    {app.companyName}
                                  </h4>
                                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                                    {app.roleTitle}
                                  </p>
                                </div>
                              </div>

                              {/* Badges metadata row for high visibility */}
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8.5px] font-bold text-slate-600 uppercase tracking-wide border border-slate-200/50">
                                  {app.jobType.replace('_', ' ')}
                                </span>
                                
                                {app.resumeId && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 text-[8.5px] font-bold text-indigo-700" title="Resume linked">
                                    <FileText size={8} /> Resume
                                  </span>
                                )}

                                {app.reminders && app.reminders.some(r => !r.isCompleted) && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-100/60 px-2 py-0.5 text-[8.5px] font-bold text-amber-700 animate-pulse" title="Pending task/interview">
                                    <Bell size={8} /> Task
                                  </span>
                                )}
                              </div>

                              {(app.location || app.appliedAt) && (
                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                  {app.location ? (
                                    <div className="flex items-center gap-1 truncate max-w-[125px]">
                                      <MapPin size={10} />
                                      <span className="truncate">{app.location}</span>
                                    </div>
                                  ) : <div />}

                                  {app.appliedAt && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-455 font-medium flex-shrink-0">
                                      <Calendar size={10} />
                                      <span>
                                        {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between border-t border-slate-150 pt-2.5">
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                                  <span className="flex items-center gap-0.5">
                                    <MessageSquare size={10} />{" "}
                                    {(app.notes || []).length}
                                  </span>
                                  <span className="text-[10px] font-semibold uppercase">
                                    {app.sourcePlatform.slice(0, 3)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 relative">
                                  {/* Color Picker Popover Toggle */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setActiveColorPickerAppId(activeColorPickerAppId === app.id ? null : app.id);
                                    }}
                                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-755 cursor-pointer"
                                    title="Change card color"
                                  >
                                    <Palette size={11} />
                                  </button>

                                  <Link
                                    href={`/applications/${app.id}`}
                                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-750"
                                  >
                                    <Eye size={11} />
                                  </Link>

                                  {/* Color Picker Dropdown Popover */}
                                  {activeColorPickerAppId === app.id && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setActiveColorPickerAppId(null);
                                        }}
                                      />
                                      <div className="absolute right-0 bottom-7 z-20 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                                        {Object.entries(colorMap).map(([colorName, styles]) => (
                                          <button
                                            key={colorName}
                                            onClick={async (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              await updateApplication(app.id, { cardColor: colorName });
                                              setActiveColorPickerAppId(null);
                                            }}
                                            className={`h-4 w-4 rounded-full ${styles.dot} border border-black/10 hover:scale-125 hover:shadow-sm transition-all duration-150 cursor-pointer`}
                                            title={styles.label}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drop-bounce {
          0% { transform: scale(0.92); opacity: 0.8; }
          40% { transform: scale(1.04); opacity: 1; }
          70% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        .animate-drop-bounce {
          animation: drop-bounce 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
        }
      `}} />
    </div>
  );
}
