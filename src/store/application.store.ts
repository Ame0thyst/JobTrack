import { create } from 'zustand';
import { toast } from 'sonner';

export type JobType = 'INTERNSHIP' | 'FULL_TIME' | 'FREELANCE' | 'CONTRACT' | 'OTHER';

export type StageType =
  | 'WATCHING'
  | 'PREPARED'
  | 'APPLIED'
  | 'HR_SCREENING'
  | 'INTERVIEW_1'
  | 'INTERVIEW_2'
  | 'REVIEW'
  | 'OFFER'
  | 'REJECTED';

export type SourcePlatform =
  | 'LINKEDIN'
  | 'INDEED'
  | 'UPWORK'
  | 'REFERRAL'
  | 'COMPANY_WEBSITE'
  | 'OTHER';

export interface ApplicationStage {
  id: string;
  stage: StageType;
  enteredAt: string;
  leftAt: string | null;
  note: string | null;
}

export interface ApplicationNote {
  id: string;
  content: string;
  createdAt: string;
  type?: string;
  title?: string | null;
}

export interface Contact {
  id: string;
  applicationId: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  title: string;
  fileUrl: string | null;
  version: number;
}

export type ReminderType = 'FOLLOW_UP' | 'INTERVIEW' | 'DEADLINE' | 'OTHER';

export interface Reminder {
  id: string;
  type: ReminderType;
  remindAt: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  companyName: string;
  companyLogo: string | null;
  companyWebsite: string | null;
  companyIndustry: string | null;
  companyDescription: string | null;
  companyFounded: string | null;
  roleTitle: string;
  jobType: JobType;
  location: string | null;
  jobUrl: string | null;
  sourcePlatform: SourcePlatform;
  currentStage: StageType;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stages?: ApplicationStage[];
  notes?: ApplicationNote[];
  reminders?: Reminder[];
  contacts?: Contact[];
  resumeId: string | null;
  resume?: Resume | null;
  cardColor?: string | null;
  
  // Salary Tracking
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  benefits?: string | null;

  // Job Description Archiver
  jobDescription?: string | null;

  // AI ATS Match Cache
  aiMatchAnalysis?: string | null;
}

export type CreateApplicationInput = Omit<
  JobApplication,
  'id' | 'createdAt' | 'updatedAt' | 'stages' | 'notes' | 'reminders' | 'contacts'
>;

interface ApplicationState {
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;
  selectedApplication: JobApplication | null;
  
  setSelectedApplication: (app: JobApplication | null) => void;
  fetchApplications: () => Promise<void>;
  addApplication: (app: CreateApplicationInput) => Promise<boolean>;
  updateApplication: (id: string, updates: Partial<JobApplication>) => Promise<boolean>;
  deleteApplication: (id: string) => Promise<boolean>;
  deleteApplicationsBulk: (ids: string[]) => Promise<boolean>;
  changeStage: (id: string, stage: StageType, note?: string) => Promise<boolean>;
  addNote: (id: string, content: string, type?: string, title?: string) => Promise<boolean>;
  addReminder: (id: string, type: string, remindAt: string) => Promise<boolean>;
  toggleReminder: (reminderId: string, isCompleted: boolean) => Promise<boolean>;
  
  // Contacts
  addContact: (applicationId: string, contact: Omit<Contact, 'id' | 'applicationId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateContact: (applicationId: string, contactId: string, updates: Partial<Contact>) => Promise<boolean>;
  deleteContact: (applicationId: string, contactId: string) => Promise<boolean>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  isLoading: false,
  error: null,
  selectedApplication: null,

  setSelectedApplication: (app) => set({ selectedApplication: app }),

  fetchApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        set({ applications: data.applications });
        
        // Update selected application if it is currently open
        const currentSelected = get().selectedApplication;
        if (currentSelected) {
          const updated = data.applications.find((a: JobApplication) => a.id === currentSelected.id);
          if (updated) {
            set({ selectedApplication: updated });
          }
        }
      } else {
        const err = await res.json();
        set({ error: err.message || 'Failed to fetch applications' });
        toast.error(err.message || 'Failed to fetch applications');
      }
    } catch (e) {
      set({ error: 'Network error. Failed to load applications.' });
      toast.error('Network error. Failed to load applications.');
    } finally {
      set({ isLoading: false });
    }
  },

  addApplication: async (appData) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });
      if (res.ok) {
        await get().fetchApplications();
        toast.success('Application added successfully');
        return true;
      }
      toast.error('Failed to add application');
      return false;
    } catch (e) {
      toast.error('Failed to add application');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateApplication: async (id, updates) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteApplication: async (id) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const currentSelected = get().selectedApplication;
        if (currentSelected?.id === id) {
          set({ selectedApplication: null });
        }
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteApplicationsBulk: async (ids) => {
    try {
      const res = await fetch('/api/applications/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const currentSelected = get().selectedApplication;
        if (currentSelected && ids.includes(currentSelected.id)) {
          set({ selectedApplication: null });
        }
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  changeStage: async (id, stage, note) => {
    try {
      const res = await fetch(`/api/applications/${id}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, note }),
      });
      if (res.ok) {
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  addNote: async (id, content, type = 'GENERAL', title) => {
    try {
      const res = await fetch(`/api/applications/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, title }),
      });
      if (res.ok) {
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  addReminder: async (id, type, remindAt) => {
    try {
      const res = await fetch(`/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, type, remindAt }),
      });
      if (res.ok) {
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  toggleReminder: async (reminderId, isCompleted) => {
    try {
      const res = await fetch(`/api/reminders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId, isCompleted }),
      });
      if (res.ok) {
        await get().fetchApplications();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Contacts Actions
  addContact: async (applicationId, contact) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (res.ok) {
        await get().fetchApplications();
        toast.success('Contact added successfully');
        return true;
      }
      toast.error('Failed to add contact');
      return false;
    } catch (e) {
      toast.error('Failed to add contact');
      return false;
    }
  },

  updateContact: async (applicationId, contactId, updates) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await get().fetchApplications();
        toast.success('Contact updated successfully');
        return true;
      }
      toast.error('Failed to update contact');
      return false;
    } catch (e) {
      toast.error('Failed to update contact');
      return false;
    }
  },

  deleteContact: async (applicationId, contactId) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await get().fetchApplications();
        toast.success('Contact deleted successfully');
        return true;
      }
      toast.error('Failed to delete contact');
      return false;
    } catch (e) {
      toast.error('Failed to delete contact');
      return false;
    }
  },
}));
