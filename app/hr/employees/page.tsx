'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Search, Plus, Loader2, Mail, Phone, 
  Briefcase, Calendar, Building, X, CheckCircle2, Trash2, Edit3, Eye, FileSpreadsheet, Download, CheckSquare, Square, SlidersHorizontal, Settings 
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import EditEmployeeModal from '@/components/EditEmployeeModal';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Bulk Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  // Customizable Export Fields State
  const [exportFields, setExportFields] = useState({
    employeeCode: true,
    name: true,
    email: true,
    phone: true,
    department: true,
    position: true,
    joiningDate: true,
    bloodGroup: true,
    gender: true,
    baseSalary: false,
    mobileBillLimit: false,
    status: true
  });

  const [newEmp, setNewEmp] = useState({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: 'Engineering',
    joiningDate: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    bloodGroup: '',
    gender: '',
    baseSalary: '50000',
    mobileBillLimit: '1500',
    usesCompanyTransport: false,
    transportRouteFare: '0'
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // --- SELECTION HANDLERS ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- BULK DELETE ---
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} employee profiles?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      }
      setEmployees(employees.filter(e => !selectedIds.includes(e.id)));
      setSelectedIds([]);
    } catch (err) {
      alert("Failed to perform bulk delete.");
    }
  };

  // --- CUSTOMIZABLE EXPORT ---
  const handleCustomExport = () => {
    const targetList = selectedIds.length > 0 
      ? employees.filter(e => selectedIds.includes(e.id))
      : filteredEmployees;

    const formattedData = targetList.map(emp => {
      const row: any = {};
      if (exportFields.employeeCode) row['Employee ID'] = emp.employeeCode || 'N/A';
      if (exportFields.name) row['Full Name'] = emp.name;
      if (exportFields.email) row['Email'] = emp.email || 'N/A';
      if (exportFields.phone) row['Phone'] = emp.phone || 'N/A';
      if (exportFields.department) row['Department'] = emp.department;
      if (exportFields.position) row['Designation'] = emp.position;
      if (exportFields.joiningDate) row['Joining Date'] = emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A';
      if (exportFields.bloodGroup) row['Blood Group'] = emp.bloodGroup || 'N/A';
      if (exportFields.gender) row['Gender'] = emp.gender || 'N/A';
      if (exportFields.baseSalary) row['Base Salary (৳)'] = emp.baseSalary || 0;
      if (exportFields.mobileBillLimit) row['Mobile Bill Limit (৳)'] = emp.mobileBillLimit || 0;
      if (exportFields.status) row['Status'] = emp.status;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, `Employee_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportModalOpen(false);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEmp,
          dateOfBirth: newEmp.dateOfBirth ? new Date(newEmp.dateOfBirth).toISOString() : null,
          baseSalary: parseFloat(newEmp.baseSalary) || 0,
          mobileBillLimit: parseFloat(newEmp.mobileBillLimit) || 0,
          transportRouteFare: parseFloat(newEmp.transportRouteFare) || 0,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create employee profile');

      setEmployees([data, ...employees]);
      setIsCreateModalOpen(false);
      setNewEmp({
        employeeCode: '', name: '', email: '', phone: '',
        position: '', department: 'Engineering', bloodGroup: '', gender: '', dateOfBirth: '',
        joiningDate: new Date().toISOString().split('T')[0],
        baseSalary: '50000', mobileBillLimit: '1500',
        usesCompanyTransport: false, transportRouteFare: '0'
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rawData = XLSX.utils.sheet_to_json(ws);

        const mappedData = rawData
          .filter((row: any) => row['ID Card No'] || row['Employee Name']) 
          .map((row: any) => ({
            employeeCode: row['ID Card No']?.toString().trim(),
            name: row['Employee Name']?.toString().trim(),
            email: row['Email'] || row['email'], 
            gender: row['Sex']?.toString().trim(),
            position: row['Designation']?.toString().trim(),
            department: row['Section']?.toString().trim(),
            phone: row['Mobile']?.toString().trim(),
            bloodGroup: row['Blood Group']?.toString().trim(),
            dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']).toISOString() : undefined,
            joiningDate: row['Date of Join'] ? new Date(row['Date of Join']).toISOString() : undefined,
          }));

        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedData)
        });

        const result = await res.json();
        if (res.ok) {
          alert(`Import Complete!\nSuccessfully imported new records: ${result.count}`);
          fetchEmployees();
        } else {
          alert(result.error || "Failed to process import.");
        }
      } catch (error) {
        alert("Error parsing Excel file. Check format.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile for ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) {
      alert("Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = ['ALL', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Employee Directory</h1>
          <p className="text-neutral-500 mt-1">Manage staff profiles, departmental roles, and assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          
          <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={importing} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {importing ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <FileSpreadsheet size={16} className="text-emerald-600" />} 
            {importing ? 'Processing...' : 'Bulk Import'}
          </button>

          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Download size={16} /> Export Options {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full text-xs">
              {selectedIds.length}
            </span>
            <span>employees selected for bulk actions</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Trash2 size={14} /> Delete Selected
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept as string)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedDept === dept 
                  ? 'bg-black text-white shadow-sm' 
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, position..." 
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={24}/></div>
          ) : filteredEmployees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-20">
              <Users size={48} className="text-neutral-200 mb-4" />
              <p className="font-medium text-neutral-900 mb-1">No employees found.</p>
              <p className="text-sm">Try adjusting your search query or add a new employee profile.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-neutral-500 hover:text-black">
                      {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                        <CheckSquare size={16} className="text-blue-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department & Position</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Personal Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEmployees.map(emp => {
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <tr key={emp.id} className={`hover:bg-neutral-50/80 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleSelectOne(emp.id)} className="text-neutral-400 hover:text-black">
                          {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900 flex items-center gap-2 text-base">
                          {emp.name}
                          {emp.user && <CheckCircle2 size={16} className="text-emerald-500" title="System User" />}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">{emp.employeeCode || 'ID Pending'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{emp.position}</div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100 mt-1">{emp.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-neutral-600 flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5"><Mail size={12} className="text-neutral-400"/> {emp.email || 'No email'}</span>
                          <span className="flex items-center gap-1.5"><Phone size={12} className="text-neutral-400"/> {emp.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                           {emp.bloodGroup ? (
                             <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider w-fit">
                               Blood: {emp.bloodGroup}
                             </span>
                           ) : <span className="text-xs text-neutral-400">-</span>}
                           {emp.dateOfBirth && (
                             <span className="text-[10px] font-medium text-neutral-500">
                               Age: {calculateAge(emp.dateOfBirth)} yrs
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/hr/employees/${emp.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                          title="View Full Profile"
                        >
                          <Eye size={14} /> View
                        </Link>
                        
                        <button 
                          onClick={() => setEditingEmployee(emp)}
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block align-middle" 
                          title="Edit Quick Details"
                        >
                          <Edit3 size={18} />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block align-middle" 
                          title="Delete Profile"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- CUSTOMIZABLE EXPORT OPTIONS MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <div>
                <h2 className="font-bold text-neutral-900 flex items-center gap-2"><SlidersHorizontal size={18} className="text-blue-600" /> Customize Export Fields</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Select columns to include in your exported Excel report.</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-neutral-400 hover:text-black rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Object.keys(exportFields).map(key => (
                <label key={key} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 cursor-pointer">
                  <span className="text-sm font-medium text-neutral-800 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <input 
                    type="checkbox"
                    checked={(exportFields as any)[key]}
                    onChange={(e) => setExportFields({...exportFields, [key]: e.target.checked})}
                    className="w-4 h-4 accent-black rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg">Cancel</button>
              <button onClick={handleCustomExport} className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 shadow-sm flex items-center gap-2">
                <Download size={14} /> Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Employee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Register New Employee</h2>
                <p className="text-sm text-neutral-500 mt-1">Create an HR record with compensation details.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-200/50 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmployee} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 space-y-6">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-lg">{error}</div>}
                
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Full Name *</label>
                    <input type="text" required value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors" placeholder="e.g. Tanvir Ahmed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Employee Code / ID *</label>
                    <input type="text" required value={newEmp.employeeCode} onChange={e => setNewEmp({...newEmp, employeeCode: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm uppercase transition-colors font-mono" placeholder="e.g. FAL-042" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Corporate Email</label>
                    <input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors" placeholder="user@fal.com.bd" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Phone Number</label>
                    <input type="text" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors" placeholder="+8801..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Gender</label>
                    <select value={newEmp.gender} onChange={e => setNewEmp({...newEmp, gender: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm bg-white transition-colors">
                      <option value="">-- Optional --</option>
                      {genders.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Department</label>
                    <input type="text" required value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors" placeholder="e.g. Engineering" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Position / Title</label>
                    <input type="text" required value={newEmp.position} onChange={e => setNewEmp({...newEmp, position: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors" placeholder="e.g. Software Engineer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Blood Group</label>
                    <select value={newEmp.bloodGroup} onChange={e => setNewEmp({...newEmp, bloodGroup: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm bg-white transition-colors">
                      <option value="">-- Optional --</option>
                      {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Date of Birth</label>
                    <input type="date" value={newEmp.dateOfBirth} onChange={e => setNewEmp({...newEmp, dateOfBirth: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm bg-white transition-colors font-mono" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2 pt-2">Compensation & Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Joining Date</label>
                    <input type="date" required value={newEmp.joiningDate} onChange={e => setNewEmp({...newEmp, joiningDate: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm bg-white transition-colors font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Base Salary (Gross, ৳)</label>
                    <input type="number" required value={newEmp.baseSalary} onChange={e => setNewEmp({...newEmp, baseSalary: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Mobile Bill Limit (৳)</label>
                    <input type="number" required value={newEmp.mobileBillLimit} onChange={e => setNewEmp({...newEmp, mobileBillLimit: e.target.value})} className="w-full p-2.5 border border-neutral-200 rounded-lg outline-none focus:border-black text-sm transition-colors font-mono" />
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 sticky bottom-0">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95 transition-all">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Edit Employee Modal */}
      <EditEmployeeModal 
        isOpen={!!editingEmployee} 
        onClose={() => setEditingEmployee(null)} 
        employee={editingEmployee}
        onSuccess={() => {
          fetchEmployees();
          setEditingEmployee(null);
        }}
      />

    </div>
  );
}