import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface SettingsState {
  // --- GENERAL SETTINGS ---
  companyName: string;
  setCompanyName: (name: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  workDayStart: string;
  setWorkDayStart: (time: string) => void;
  workDayEnd: string;
  setWorkDayEnd: (time: string) => void;

  // --- RECRUITMENT SETTINGS ---
  positions: string[];
  addPosition: (pos: string) => void;
  removePosition: (pos: string) => void;
  
  departments: string[];
  addDepartment: (dept: string) => void;
  removeDepartment: (dept: string) => void;
  
  employmentTypes: string[];
  addEmploymentType: (type: string) => void;
  removeEmploymentType: (type: string) => void;
  
  // --- DYNAMIC CUSTOM FIELDS (Unified with alias support) ---
  customFields: CustomField[]; // Alias for candidateFields for backwards compatibility
  addField: (field: CustomField) => void;
  removeField: (id: string) => void;

  candidateFields: CustomField[];
  addCandidateField: (field: CustomField) => void;
  removeCandidateField: (id: string) => void;

  employeeFields: CustomField[];
  addEmployeeField: (field: CustomField) => void;
  removeEmployeeField: (id: string) => void;

  // --- TEMPLATES ---
  emailTemplate: string;
  setEmailTemplate: (template: string) => void;
  
  smsTemplate: string;
  setSmsTemplate: (template: string) => void;

  whatsappTemplate: string;
  setWhatsappTemplate: (template: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // General Defaults
      companyName: 'HR 101 Enterprise',
      setCompanyName: (name) => set({ companyName: name }),
      timezone: 'Asia/Dhaka',
      setTimezone: (tz) => set({ timezone: tz }),
      workDayStart: '09:00',
      setWorkDayStart: (time) => set({ workDayStart: time }),
      workDayEnd: '18:00',
      setWorkDayEnd: (time) => set({ workDayEnd: time }),

      // Recruitment Defaults
      positions: ['Software Engineer', 'Product Manager', 'UX Designer', 'HR Specialist', 'Intern', 'Executive', 'Jr. Executive', 'Sr. Executive'],
      addPosition: (pos) => set((state) => ({ positions: [...new Set([...state.positions, pos])] })),
      removePosition: (pos) => set((state) => ({ positions: state.positions.filter(p => p !== pos) })),
      
      departments: ['Engineering', 'Marketing', 'Human Resources', 'Sales', 'Design', 'Merchandising'],
      addDepartment: (dept) => set((state) => ({ departments: [...new Set([...state.departments, dept])] })),
      removeDepartment: (dept) => set((state) => ({ departments: state.departments.filter(d => d !== dept) })),
      
      employmentTypes: ['Regular Employee', 'Intern', 'Contractor'],
      addEmploymentType: (type) => set((state) => ({ employmentTypes: [...new Set([...state.employmentTypes, type])] })),
      removeEmploymentType: (type) => set((state) => ({ employmentTypes: state.employmentTypes.filter(t => t !== type) })),
      
      // Dynamic Custom Fields Defaults
      customFields: [
        { id: 'portfolio', label: 'Portfolio URL', type: 'url', required: false },
        { id: 'expectedSalary', label: 'Expected Salary', type: 'number', required: false }
      ],
      addField: (field) => set((state) => ({ 
        customFields: [...state.customFields, field],
        candidateFields: [...state.candidateFields, field]
      })),
      removeField: (id) => set((state) => ({ 
        customFields: state.customFields.filter(f => f.id !== id),
        candidateFields: state.candidateFields.filter(f => f.id !== id)
      })),

      candidateFields: [
        { id: 'portfolio', label: 'Portfolio URL', type: 'url', required: false },
        { id: 'expectedSalary', label: 'Expected Salary', type: 'number', required: false }
      ],
      addCandidateField: (field) => set((state) => ({ 
        candidateFields: [...state.candidateFields, field],
        customFields: [...state.customFields, field]
      })),
      removeCandidateField: (id) => set((state) => ({ 
        candidateFields: state.candidateFields.filter(f => f.id !== id),
        customFields: state.customFields.filter(f => f.id !== id)
      })),

      employeeFields: [
        { id: 'bloodGroup', label: 'Blood Group', type: 'select', required: true, options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
        { id: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true }
      ],
      addEmployeeField: (field) => set((state) => ({ employeeFields: [...state.employeeFields, field] })),
      removeEmployeeField: (id) => set((state) => ({ employeeFields: state.employeeFields.filter(f => f.id !== id) })),

      // Templates
      emailTemplate: `Dear {{candidate_name}},\n\nYou have been selected for an interview for the {{position}} position at our company.\n\nDate: {{interview_date}}\nTime: {{interview_time}}\nDuration: {{interview_duration}} minutes\n\nPlease reply to confirm your availability.\n\nBest regards,\nHR Department`,
      setEmailTemplate: (template) => set({ emailTemplate: template }),

      smsTemplate: `Hi {{candidate_name}}, your interview for {{position}} is on {{interview_date}} at {{interview_time}}. Please confirm your availability.`,
      setSmsTemplate: (template) => set({ smsTemplate: template }),

      whatsappTemplate: `Hi {{candidate_name}}, you have been scheduled for an interview for the position of {{position}}. \n\n📅 Date: {{interview_date}}\n⏰ Time: {{interview_time}}\n\nPlease confirm your availability.`,
      setWhatsappTemplate: (template) => set({ whatsappTemplate: template }),
    }),
    { name: 'hr-settings' } 
  )
);