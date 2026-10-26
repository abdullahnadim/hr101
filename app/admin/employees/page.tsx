'use client';
import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Mail, Phone, Briefcase, Loader2, Upload, Trash2, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => { setEmployees(data); setLoading(false); });
  };

  useEffect(() => { fetchEmployees(); }, []);

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
    <div className="p-8 max-w-6xl mx-auto space-y-6 relative pb-24">
      
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
          <button onClick={() => setIsAddModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-md">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* --- INJECT DYNAMIC MODALS --- */}
      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchEmployees} 
      />

      <EditEmployeeModal 
        isOpen={!!editingEmployee} 
        onClose={() => setEditingEmployee(null)} 
        employee={editingEmployee} 
        onSuccess={fetchEmployees} 
      />

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input type="checkbox" onChange={toggleSelectAll} checked={employees.length > 0 && selectedIds.length === employees.length} className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer" />
                </th>
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
                    <td className="px-4 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => toggleSelect(emp.id)} className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{emp.name}</div>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">{emp.employeeCode || emp.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2"><Briefcase size={14} className="text-neutral-400"/> {emp.position}</div>
                      <div className="text-xs text-neutral-500 mt-1">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-neutral-600"><Mail size={14} className="text-neutral-400"/> {emp.email ? emp.email : <span className="text-neutral-400 italic text-xs">No email</span>}</div>
                      <div className="flex items-center gap-2 text-neutral-600"><Phone size={14} className="text-neutral-400"/> {emp.phone === 'N/A' || !emp.phone ? <span className="text-neutral-400 italic text-xs">No phone</span> : emp.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>{emp.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/employees/${emp.id}`} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors" title="View Profile">
                          <Eye size={16} />
                        </Link>
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