'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationStore, JobApplication } from '@/store/application.store';
import { 
  Search, 
  Briefcase, 
  User, 
  FileText, 
  Building2,
  X,
  Sparkles
} from 'lucide-react';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'applications' | 'contacts' | 'notes' | 'companies';
  url: string;
  metadata?: string;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { applications } = useApplicationStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle outside click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Perform search across store data
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    // Search Job Applications
    applications.forEach((app) => {
      const matchCompany = app.companyName.toLowerCase().includes(searchTerm);
      const matchRole = app.roleTitle.toLowerCase().includes(searchTerm);
      const matchLocation = app.location?.toLowerCase().includes(searchTerm);
      const matchPlatform = app.sourcePlatform.toLowerCase().includes(searchTerm);

      if (matchCompany || matchRole || matchLocation || matchPlatform) {
        matches.push({
          id: `app-${app.id}`,
          title: app.companyName,
          subtitle: `${app.roleTitle} • ${app.location || 'Remote/N/A'}`,
          category: 'applications',
          url: `/applications/${app.id}`,
          metadata: `Platform: ${app.sourcePlatform} | Stage: ${app.currentStage.replace('_', ' ')}`
        });
      }

      // Search Contacts
      if (app.contacts) {
        app.contacts.forEach((contact) => {
          const matchName = contact.name.toLowerCase().includes(searchTerm);
          const matchRoleCont = contact.role?.toLowerCase().includes(searchTerm);
          const matchEmail = contact.email?.toLowerCase().includes(searchTerm);

          if (matchName || matchRoleCont || matchEmail) {
            matches.push({
              id: `contact-${contact.id}`,
              title: contact.name,
              subtitle: `${contact.role || 'Contact'} @ ${app.companyName}`,
              category: 'contacts',
              url: `/applications/${app.id}`,
              metadata: [contact.email, contact.phone].filter(Boolean).join(' | ')
            });
          }
        });
      }

      // Search Notes
      if (app.notes) {
        app.notes.forEach((note) => {
          const matchContent = note.content.toLowerCase().includes(searchTerm);
          const matchTitle = note.title?.toLowerCase().includes(searchTerm);

          if (matchContent || matchTitle) {
            matches.push({
              id: `note-${note.id}`,
              title: note.title || 'General Note',
              subtitle: `inside application for ${app.companyName}`,
              category: 'notes',
              url: `/applications/${app.id}`,
              metadata: note.content.length > 80 ? `${note.content.slice(0, 80)}...` : note.content
            });
          }
        });
      }
    });

    // Extract Unique Companies for Company Search
    const uniqueCompaniesMap = new Map<string, JobApplication>();
    applications.forEach((app) => {
      const key = app.companyName.trim().toLowerCase();
      if (!uniqueCompaniesMap.has(key)) {
        uniqueCompaniesMap.set(key, app);
      }
    });

    uniqueCompaniesMap.forEach((app) => {
      if (app.companyName.toLowerCase().includes(searchTerm)) {
        matches.push({
          id: `company-${app.companyName}`,
          title: app.companyName,
          subtitle: `Company Profile in workspace`,
          category: 'companies',
          url: '/companies',
          metadata: app.companyIndustry ? `Industry: ${app.companyIndustry}` : undefined
        });
      }
    });

    setResults(matches.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  }, [query, applications]);

  // Handle Keyboard Shortcuts & Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'applications':
        return <Briefcase size={14} className="text-indigo-500" />;
      case 'contacts':
        return <User size={14} className="text-teal-500" />;
      case 'notes':
        return <FileText size={14} className="text-amber-500" />;
      case 'companies':
        return <Building2 size={14} className="text-sky-500" />;
      default:
        return <Search size={14} className="text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-[15vh] backdrop-blur-md transition-opacity duration-300"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[60vh]">
        {/* Search Input Area */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <Search size={20} className="text-slate-450 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type company, role title, recruiter name, or notes... (Arrow keys to navigate)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
          />
          <button 
            onClick={onClose}
            className="rounded-xl p-1 text-slate-450 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results list */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {query.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-450 text-center">
              <Sparkles size={32} className="text-indigo-400 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-700">Quick Global Command Center</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Search anything instantly across job applications, recruiters, interview notes, or company directories.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No results found for &quot;<span className="font-bold text-slate-650">{query}</span>&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={res.id}
                    onClick={() => handleSelect(res)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getCategoryIcon(res.category)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-850'}`}>
                          {res.title}
                        </p>
                        <p className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {res.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      {res.metadata && (
                        <span className={`text-[10px] hidden sm:inline-block font-medium ${
                          isSelected ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          {res.metadata}
                        </span>
                      )}
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border shrink-0 ${
                        isSelected 
                          ? 'border-white/30 bg-white/20 text-white' 
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        {res.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="border-t border-slate-150/75 bg-slate-50 px-5 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>JobTrack Global Search</span>
        </div>
      </div>
    </div>
  );
};
