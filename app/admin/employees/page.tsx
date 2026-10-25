'use client';
import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Mail, Phone, Briefcase, Loader2, Upload, Trash2, Edit, Eye, X } from 'lucide-react';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: Edit Modal State
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({ 
    employeeCode: '', name: '', email: '', phone: '', position: '', department: '', joiningDate: '' 
  });

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => { setEmployees(data); setLoading(false); });
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setSaving(false);
    setShowAddForm(false);
    setFormData({ employeeCode: '', name: '', email: '', phone: '', position: '', department: '', joiningDate: '' });
    fetchEmployees();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    await fetch(`/api/employees/${editingEmployee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingEmployee)
    });
    setUpdating(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim().length > 0);
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
      
      const parsedData = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        const emp: any = {};
        headers.forEach((header, index) => { emp[header] = values[index]; });
        return emp;
      });

      await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });
      fetchEmployees();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(employees.map(emp => emp.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id?: string) => {
    const idsToDelete = id ? [id] : selectedIds;
    if (!confirm(`Are you sure you want to delete ${idsToDelete.length} employee(s)?`)) return;

    setLoading(true);
    await fetch('/api/employees', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToDelete })
    });
    setSelectedIds([]);
    fetchEmployees();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 relative">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="text-blue-600" /> Employee Directory
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage active staff and onboard new hires.</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button onClick={() => handleDelete()} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-100 transition-colors shadow-sm">
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
          )}
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-50 transition-colors shadow-sm">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-md">
            <Plus size={16} /> {showAddForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-inner">
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Employee ID</label><input type="text" required className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, employeeCode: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Full Name</label><input type="text" required className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Email Address</label><input type="email" className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Phone Number</label><input type="text" required className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Department</label><input type="text" required className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, department: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Job Title</label><input type="text" required className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, position: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-neutral-700 uppercase">Joining Date</label><input type="date" required className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" onChange={e => setFormData({...formData, joiningDate: e.target.value})} /></div>
          <div className="md:col-span-2 flex justify-end mt-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* NEW: Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="font-bold text-lg text-neutral-900 flex items-center gap-2"><Edit size={18} className="text-blue-600"/> Edit Employee</h2>
              <button onClick={() => setEditingEmployee(null)} className="text-neutral-400 hover:text-neutral-700 p-1"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-neutral-700 uppercase">Employee ID</label><input type="text" required value={editingEmployee.employeeCode} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black bg-neutral-50" readOnly /></div>
              <div><label className="text-xs font-bold text-neutral-700 uppercase">Full Name</label><input type="text" required value={editingEmployee.name} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" /></div>
              <div><label className="text-xs font-bold text-neutral-700 uppercase">Email Address</label><input type="email" value={editingEmployee.email || ''} onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" /></div>
              <div><label className="text-xs font-bold text-neutral-700 uppercase">Phone Number</label><input type="text" required value={editingEmployee.phone} onChange={e => setEditingEmployee({...editingEmployee, phone: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" /></div>
              <div><label className="text-xs font-bold text-neutral-700 uppercase">Department</label><input type="text" required value={editingEmployee.department} onChange={e => setEditingEmployee({...editingEmployee, department: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" /></div>
              <div><label className="text-xs font-bold text-neutral-700 uppercase">Job Title</label><input type="text" required value={editingEmployee.position} onChange={e => setEditingEmployee({...editingEmployee, position: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black" /></div>
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase">Status</label>
                <select value={editingEmployee.status} onChange={e => setEditingEmployee({...editingEmployee, status: e.target.value})} className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-black bg-white">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-neutral-100 gap-3">
                <button type="button" onClick={() => setEditingEmployee(null)} className="px-5 py-2 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors">Cancel</button>
                <button type="submit" disabled={updating} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
                  {updating ? <Loader2 size={16} className="animate-spin" /> : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-4 w-12 text-center"><input type="checkbox" onChange={toggleSelectAll} checked={employees.length > 0 && selectedIds.length === employees.length} className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer" /></th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role & Dept</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {employees.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No employees found. Click "Import CSV" or "Add Employee" to start.</td></tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-4 text-center"><input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => toggleSelect(emp.id)} className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer" /></td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{emp.name}</div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">{emp.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2"><Briefcase size={14} className="text-neutral-400"/> {emp.position}</div>
                      <div className="text-xs text-neutral-500 mt-1">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-neutral-600"><Mail size={14} className="text-neutral-400"/> {emp.email ? emp.email : <span className="text-neutral-400 italic text-xs">No email added</span>}</div>
                      <div className="flex items-center gap-2 text-neutral-600"><Phone size={14} className="text-neutral-400"/> {emp.phone === 'N/A' || !emp.phone ? <span className="text-neutral-400 italic text-xs">No phone added</span> : emp.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>{emp.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors" title="View Profile">
                          <Eye size={16} />
                        </button>
                        {/* Wires up the Edit button */}
                        <button onClick={() => setEditingEmployee(emp)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors" title="Edit Employee">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Delete Employee">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}