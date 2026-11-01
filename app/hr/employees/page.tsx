'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, Plus, Loader2, Mail, Phone, 
  X, CheckCircle2, Trash2, Edit3, Eye, Download, CheckSquare, Square, SlidersHorizontal 
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import ImportEmployeeButton from '@/components/ImportEmployeeButton';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  
  const [exportFields, setExportFields] = useState({
    employeeCode: true, name: true, email: true, phone: true, department: true, 
    position: true, joiningDate: true, bloodGroup: true, gender: true, baseSalary: false, 
    mobileBillLimit: false, status: true
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) setSelectedIds([]);
    else setSelectedIds(filteredEmployees.map(e => e.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} employee profiles?`)) return;
    try {
      for (const id of selectedIds) await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      setEmployees(employees.filter(e => !selectedIds.includes(e.id)));
      setSelectedIds([]);
    } catch (err) { alert("Failed to perform bulk delete."); }
  };

  const handleCustomExport = () => {
    const targetList = selectedIds.length > 0 ? employees.filter(e => selectedIds.includes(e.id)) : filteredEmployees;
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

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile for ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) { alert("Failed to delete employee"); }
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
          
          <ImportEmployeeButton onImportSuccess={fetchEmployees} />

          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
            <Download size={16} /> Export Options {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>

          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm active:scale-95">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-neutral-900 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full text-xs">{selectedIds.length}</span>
            <span>employees selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm"><Trash2 size={14} /> Delete Selected</button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-neutral-400 hover:text-white px-2 py-1">Deselect All</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {departments.map(dept => (
              <button key={dept} onClick={() => setSelectedDept(dept as string)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${selectedDept === dept ? 'bg-black text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}>
                {dept}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, ID, position..." className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-black bg-white" />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20"><Loader2 className="animate-spin text-neutral-400" size={24}/></div>
          ) : filteredEmployees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-20">
              <Users size={48} className="text-neutral-200 mb-4" />
              <p className="font-medium text-neutral-900 mb-1">No employees found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-neutral-500 hover:text-black">
                      {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
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
                          {emp.user && <span title="System User"><CheckCircle2 size={16} className="text-emerald-500" /></span>}
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
                           {emp.bloodGroup ? <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider w-fit">Blood: {emp.bloodGroup}</span> : <span className="text-xs text-neutral-400">-</span>}
                           {emp.dateOfBirth && <span className="text-[10px] font-medium text-neutral-500">Age: {calculateAge(emp.dateOfBirth)} yrs</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link href={`/hr/employees/${emp.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-lg border border-neutral-200" title="View Full Profile"><Eye size={14} /> View</Link>
                        <button onClick={() => setEditingEmployee(emp)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-block align-middle" title="Edit"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg inline-block align-middle" title="Delete"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Customizable Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <div>
                <h2 className="font-bold text-neutral-900 flex items-center gap-2"><SlidersHorizontal size={18} className="text-blue-600" /> Customize Export</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Select columns for Excel report.</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 text-neutral-400 hover:text-black rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Object.keys(exportFields).map(key => (
                <label key={key} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50 cursor-pointer">
                  <span className="text-sm font-medium text-neutral-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" checked={(exportFields as any)[key]} onChange={(e) => setExportFields({...exportFields, [key]: e.target.checked})} className="w-4 h-4 accent-black rounded cursor-pointer" />
                </label>
              ))}
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg">Cancel</button>
              <button onClick={handleCustomExport} className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 flex items-center gap-2"><Download size={14} /> Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Modals */}
      <AddEmployeeModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={(newEmp: any) => { setEmployees([newEmp, ...employees]); setIsCreateModalOpen(false); }} />
      <EditEmployeeModal isOpen={!!editingEmployee} onClose={() => setEditingEmployee(null)} employee={editingEmployee} onSuccess={() => { fetchEmployees(); setEditingEmployee(null); }} />
    </div>
  );
}