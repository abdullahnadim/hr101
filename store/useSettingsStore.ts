import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomField {
  id: string;
  label: string;
  type: string;
}

interface SettingsState {
  positions: string[];
  addPosition: (pos: string) => void;
  removePosition: (pos: string) => void;
  
  // New: Departments
  departments: string[];
  addDepartment: (dept: string) => void;
  removeDepartment: (dept: string) => void;
  
  employmentTypes: string[];
  addEmploymentType: (type: string) => void;
  removeEmploymentType: (type: string) => void;
  
  customFields: CustomField[];
  addField: (field: CustomField) => void;
  removeField: (id: string) => void;

  emailTemplate: string;
  setEmailTemplate: (template: string) => void;
  
  smsTemplate: string;
  setSmsTemplate: (template: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      positions: ['Software Engineer', 'Product Manager', 'UX Designer', 'HR Specialist'],
      addPosition: (pos) => set((state) => ({ positions: [...new Set([...state.positions, pos])] })),
      removePosition: (pos) => set((state) => ({ positions: state.positions.filter(p => p !== pos) })),
      
      // New: Departments Implementation
      departments: ['Engineering', 'Marketing', 'Human Resources', 'Sales', 'Design'],
      addDepartment: (dept) => set((state) => ({ departments: [...new Set([...state.departments, dept])] })),
      removeDepartment: (dept) => set((state) => ({ departments: state.departments.filter(d => d !== dept) })),
      
      // Existing: Employment Types
      employmentTypes: ['Regular Employee', 'Intern', 'Contractor'],
      addEmploymentType: (type) => set((state) => ({ employmentTypes: [...new Set([...state.employmentTypes, type])] })),
      removeEmploymentType: (type) => set((state) => ({ employmentTypes: state.employmentTypes.filter(t => t !== type) })),
      
      customFields: [],
      addField: (field) => set((state) => ({ customFields: [...state.customFields, field] })),
      removeField: (id) => set((state) => ({ customFields: state.customFields.filter(f => f.id !== id) })),

      emailTemplate: `Dear {{candidate_name}},\n\nYou have been selected for an interview for the {{position}} position at our company.\n\nDate: {{interview_date}}\nTime: {{interview_time}}\nDuration: {{interview_duration}} minutes\n\nPlease reply to confirm your availability.\n\nBest regards,\nHR Department`,
      setEmailTemplate: (template) => set({ emailTemplate: template }),

      smsTemplate: `Hi {{candidate_name}}, your interview for {{position}} is on {{interview_date}} at {{interview_time}}. Please confirm your availability.`,
      setSmsTemplate: (template) => set({ smsTemplate: template }),
    }),
    { name: 'hr-settings' } 
  )
);