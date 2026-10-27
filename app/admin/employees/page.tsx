'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Search, Plus, Loader2, Mail, Phone, 
  Briefcase, Calendar, Building, X, CheckCircle2, Trash2, Edit3, Eye 
} from 'lucide-react';
import Link from 'next/link';
import EditEmployeeModal from '@/components/EditEmployeeModal';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [newEmp, setNewEmp] = useState({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: 'Engineering',
    joiningDate: new Date().toISOString().split('T')[0],
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
        position: '', department: 'Engineering',
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

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile for ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees(employees.filter(emp => emp.id !== id));
      }
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

  const departments = ['ALL', ...Array.from(new Set(employees.map(e => e.department)))];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Employee Directory</h1>
          <p className="text-neutral-500 mt-1">Manage staff profiles, departmental roles, and compensation settings.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
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
          
          <div className="relative w-full sm:w-80">
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
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department & Position</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Base Salary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900 flex items-center gap-2">
                        {emp.name}
                        {emp.user && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">{emp.employeeCode || 'ID Pending'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{emp.position}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-neutral-700 flex items-center gap-1.5"><Mail size={12} className="text-neutral-400"/> {emp.email || 'No email'}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1"><Phone size={12} className="text-neutral-400"/> {emp.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-neutral-900">
                      ৳{emp.baseSalary?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      {/* UPDATED: Profile Link with Eye Icon */}
                      <Link 
                        href={`/admin/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                        title="View Full Profile"
                      >
                        <Eye size={14} /> View
                      </Link>
                      
                      <button 
                        onClick={() => setEditingEmployee(emp)}
                        className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block align-middle" 
                        title="Edit Quick Details"
                      >
                        <Edit3 size={16} />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block align-middle" 
                        title="Delete Profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Register New Employee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Register New Employee</h2>
                <p className="text-sm text-neutral-500 mt-1">Create an HR record with compensation details.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-neutral-400 hover:text-black rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmployee} className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-5">
                {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-lg">{error}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Full Name</label>
                    <input type="text" required value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" placeholder="e.g. Tanvir Ahmed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Employee Code / ID</label>
                    <input type="text" required value={newEmp.employeeCode} onChange={e => setNewEmp({...newEmp, employeeCode: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm uppercase" placeholder="e.g. FAL-042" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Corporate Email</label>
                    <input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" placeholder="employee@fal.com.bd" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Phone Number</label>
                    <input type="text" required value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" placeholder="+8801..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Position / Title</label>
                    <input type="text" required value={newEmp.position} onChange={e => setNewEmp({...newEmp, position: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" placeholder="e.g. Software Engineer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Department</label>
                    <select value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm bg-white">
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Joining Date</label>
                    <input type="date" required value={newEmp.joiningDate} onChange={e => setNewEmp({...newEmp, joiningDate: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-neutral-100">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Base Salary (Gross, ৳)</label>
                    <input type="number" required value={newEmp.baseSalary} onChange={e => setNewEmp({...newEmp, baseSalary: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Mobile Bill Limit (৳)</label>
                    <input type="number" required value={newEmp.mobileBillLimit} onChange={e => setNewEmp({...newEmp, mobileBillLimit: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm" />
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">Company Transport Usage</h4>
                      <p className="text-xs text-neutral-500">Deduct route fare from transport allowance.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setNewEmp({...newEmp, usesCompanyTransport: !newEmp.usesCompanyTransport})}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newEmp.usesCompanyTransport ? 'bg-black' : 'bg-neutral-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newEmp.usesCompanyTransport ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {newEmp.usesCompanyTransport && (
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">Route Fare (৳)</label>
                      <input type="number" value={newEmp.transportRouteFare} onChange={e => setNewEmp({...newEmp, transportRouteFare: e.target.value})} className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-black text-sm bg-white" placeholder="e.g. 6000" />
                    </div>
                  )}
                </div>

              </div>

              <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 shadow-sm">
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