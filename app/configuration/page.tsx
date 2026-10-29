'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, Check, Loader2, Building, Clock, Globe, Bell, 
  Calendar, DoorOpen, Plus, Trash2, 
  KeyRound, UserPlus, CheckCircle2, ShieldCheck, ArrowRight, Settings
} from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import ProvisionUserModal from '@/components/ProvisionUserModal';
import EditUserModal from '@/components/EditUserModal';

const tabs = [
  { id: 'general', label: 'General & Company', icon: Building },
  { id: 'rooms', label: 'Rooms & Spaces', icon: DoorOpen },
  { id: 'users', label: 'System Access', icon: KeyRound },
  { id: 'permissions', label: 'Roles & Access', icon: ShieldCheck }, 
  { id: 'leave', label: 'Leave Policies', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Store
  const { companyName, setCompanyName, timezone, setTimezone, workDayStart, setWorkDayStart, workDayEnd, setWorkDayEnd } = useSettingsStore();
  const [localCompany, setLocalCompany] = useState('');
  const [localTz, setLocalTz] = useState('');
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');

  // Rooms State
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomSaving, setRoomSaving] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', amenities: [] as string[] });

  // Leave Policies State
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [policySaving, setPolicySaving] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name: '', daysPerYear: '', isPaid: true, carryForward: false, maxCarryForward: '' });

  // Users & Provisioning State
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [roomsRes, policiesRes, usersRes, empRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/leave-policies'),
        fetch('/api/users'), 
        fetch('/api/employees')
      ]);
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (policiesRes.ok) setLeavePolicies(await policiesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (error) {
      console.error("Failed to load settings data");
    } finally {
      setRoomsLoading(false);
      setLoadingPolicies(false);
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setLocalCompany(companyName || '');
    setLocalTz(timezone || 'Asia/Dhaka');
    setLocalStart(workDayStart || '09:00');
    setLocalEnd(workDayEnd || '18:00');
    fetchData();
  }, [companyName, timezone, workDayStart, workDayEnd, fetchData]);

  if (!mounted) return null;

  // --- Handlers ---
  const handleSaveGeneral = () => {
    setIsSaving(true);
    setTimeout(() => {
      setCompanyName(localCompany);
      setTimezone(localTz);
      setWorkDayStart(localStart);
      setWorkDayEnd(localEnd);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 500);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name || !newRoom.capacity) return;
    setRoomSaving(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoom.name, capacity: newRoom.capacity, amenities: newRoom.amenities, status: 'ACTIVE' })
      });
      if (res.ok) {
        setRooms([await res.json(), ...rooms]);
        setNewRoom({ name: '', capacity: '', amenities: [] });
      }
    } catch (error) {} finally { setRoomSaving(false); }
  };

  const handleDeleteRoom = async (id: string) => {
    if(!confirm('Delete this workspace?')) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) setRooms(rooms.filter(r => r.id !== id));
    } catch (error) {}
  };

  const toggleAmenity = (amenity: string) => {
    setNewRoom(prev => ({
      ...prev, amenities: prev.amenities.includes(amenity) ? prev.amenities.filter(a => a !== amenity) : [...prev.amenities, amenity]
    }));
  };

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.name || !newPolicy.daysPerYear) return;
    setPolicySaving(true);
    try {
      const res = await fetch('/api/leave-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy)
      });
      if (res.ok) {
        setLeavePolicies([await res.json(), ...leavePolicies]);
        setNewPolicy({ name: '', daysPerYear: '', isPaid: true, carryForward: false, maxCarryForward: '' });
      }
    } catch (error) { alert("Failed to add policy"); } finally { setPolicySaving(false); }
  };

  const handleDeletePolicy = async (id: string) => {
    if(!confirm('Delete this leave policy?')) return;
    try {
      const res = await fetch(`/api/leave-policies/${id}`, { method: 'DELETE' });
      if (res.ok) setLeavePolicies(leavePolicies.filter(p => p.id !== id));
    } catch (error) {}
  };

  const handleTogglePolicyStatus = async (id: string, currentStatus: boolean) => {
    setLeavePolicies(leavePolicies.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
    try {
      await fetch(`/api/leave-policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
    } catch (error) { fetchData(); }
  };

  const handleRevokeAccess = async (id: string) => {
    if (!confirm("Are you sure you want to permanently revoke this user's system access? Their HR profile will remain intact.")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke access');
      }
    } catch (error) { alert('Failed to revoke access'); }
  };

  const ActiveTabObj = tabs.find(t => t.id === activeTab);
  const ActiveIcon = ActiveTabObj?.icon;
  const unprovisionedEmployees = employees.filter(emp => !users.some(u => u.employeeId === emp.id));

  return (
    <div className="min-h-screen bg-neutral-50/30 pb-24 animate-in fade-in duration-300">
      <header className="bg-white/90 backdrop-blur-xl border-b border-neutral-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Settings className="text-blue-600" size={20} /> Platform Settings
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage global configurations, workspaces, and system access.</p>
        </div>
        {activeTab === 'general' && (
          <button onClick={handleSaveGeneral} disabled={isSaving || isSaved} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-bold shadow-sm disabled:opacity-80 active:scale-95 ${isSaved ? 'bg-emerald-600 text-white' : 'bg-black text-white hover:bg-neutral-800'}`}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Save size={16} />}
            {isSaving ? 'Saving...' : isSaved ? 'Saved Successfully!' : 'Save Changes'}
          </button>
        )}
      </header>

      <div className="p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1.5 sticky top-28">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    isActive ? 'bg-white border border-neutral-200 text-black shadow-sm shadow-neutral-200/50' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-neutral-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <>
              <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
                  <Building size={18} className="text-blue-600" />
                  <div>
                    <h2 className="font-bold text-neutral-900">Company Profile</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Core organizational branding and details.</p>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <div className="max-w-md">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Legal Company Name</label>
                    <input type="text" value={localCompany} onChange={(e) => setLocalCompany(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors" placeholder="e.g. Acme Corporation" />
                  </div>
                </div>
              </section>

              <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2.5">
                  <Clock size={18} className="text-blue-600" />
                  <div>
                    <h2 className="font-bold text-neutral-900">Business Hours & Region</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Sets the default boundaries for schedules, payroll, and calendars.</p>
                  </div>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe size={14} className="text-neutral-400" /> Operating Timezone</label>
                    <select value={localTz} onChange={(e) => setLocalTz(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm bg-white cursor-pointer transition-colors font-medium">
                      <option value="Asia/Dhaka">Asia/Dhaka (BDT)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Work Day Start</label>
                      <input type="time" value={localStart} onChange={(e) => setLocalStart(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors font-medium"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Work Day End</label>
                      <input type="time" value={localEnd} onChange={(e) => setLocalEnd(e.target.value)} className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors font-medium"/>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* --- ROOMS TAB --- */}
          {activeTab === 'rooms' && (
            <>
              <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DoorOpen size={18} className="text-indigo-600" />
                    <div>
                      <h2 className="font-bold text-neutral-900">Add Workspace</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">Register a new physical room for meetings.</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleAddRoom} className="p-6 flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Room Name</label>
                      <input type="text" value={newRoom.name} onChange={(e) => setNewRoom({...newRoom, name: e.target.value})} placeholder="e.g. Conference Room A" className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Max Capacity</label>
                      <input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})} placeholder="e.g. 10" className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors" required min="1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Included Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {['TV', 'Video Conferencing', 'Whiteboard', 'Projector', 'Coffee Machine'].map((item) => (
                        <button 
                          key={item} type="button" onClick={() => toggleAmenity(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${newRoom.amenities.includes(item) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={roomSaving} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-bold disabled:opacity-50 active:scale-95">
                      {roomSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Register Room
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-2.5 bg-neutral-50/50">
                  <h2 className="font-bold text-neutral-900">Active Workspaces ({rooms.length})</h2>
                </div>
                <div className="divide-y divide-neutral-100 min-h-[100px]">
                  {roomsLoading ? (
                    <div className="p-8 flex justify-center text-neutral-400"><Loader2 className="animate-spin" /></div>
                  ) : rooms.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">No rooms registered yet.</div>
                  ) : (
                    rooms.map(room => {
                      let parsedAmenities = [];
                      if (Array.isArray(room.amenities)) {
                        parsedAmenities = room.amenities;
                      } else if (typeof room.amenities === 'string') {
                        try { parsedAmenities = JSON.parse(room.amenities); } catch { parsedAmenities = []; }
                      }

                      return (
                        <div key={room.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors group">
                          <div>
                            <h3 className="font-bold text-neutral-900 text-base">{room.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 bg-white border border-neutral-200 px-2 py-1 rounded-md w-fit shadow-sm">
                                <DoorOpen size={14} /> {room.capacity} People
                              </span>
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${room.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {room.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                            <div className="flex flex-wrap gap-1.5">
                              {parsedAmenities.map((a: string, i: number) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">
                                  {a}
                                </span>
                              ))}
                            </div>
                            <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete Room">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            </>
          )}

          {/* --- SYSTEM USERS TAB --- */}
          {activeTab === 'users' && (
            <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KeyRound size={18} className="text-amber-600" />
                  <div>
                    <h2 className="font-bold text-neutral-900">Provisioned Accounts</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Staff with active dashboard logins.</p>
                  </div>
                </div>
                <button onClick={() => setIsProvisionModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm active:scale-95">
                  <UserPlus size={14} /> Provision Access
                </button>
              </div>
              
              <div className="overflow-x-auto min-h-[300px]">
                {loadingUsers ? (
                  <div className="p-12 flex justify-center text-neutral-400"><Loader2 className="animate-spin" /></div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500 text-sm border border-dashed border-neutral-200 rounded-xl m-6">No user accounts provisioned yet.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200 text-[11px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Account Holder</th>
                        <th className="px-6 py-4">Assigned Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-neutral-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-neutral-900 flex items-center gap-2 text-base">
                              {user.employee?.name || 'Unlinked Account'}
                              {user.employeeId && (
                                <span title="Linked to HR Profile">
                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-medium text-neutral-500 mt-0.5 font-mono">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              user.role?.name === 'ADMIN' || user.role?.name === 'Super Admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              user.role?.name ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}>
                              {user.role?.name ? user.role.name.replace('_', ' ') : 'No Role'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setUserToEdit(user)}
                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-colors"
                              >
                                Edit Access
                              </button>
                              <button onClick={() => handleRevokeAccess(user.id)} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors">
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* --- LEAVE POLICIES TAB --- */}
          {activeTab === 'leave' && (
            <>
              <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-emerald-600" />
                    <div>
                      <h2 className="font-bold text-neutral-900">Create Leave Policy</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">Define PTO, Sick Leave, or Maternity allocations.</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleAddPolicy} className="p-6 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Policy Name</label>
                      <input type="text" value={newPolicy.name} onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})} placeholder="e.g. Annual Paid Leave" className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Days Per Year</label>
                      <input type="number" value={newPolicy.daysPerYear} onChange={(e) => setNewPolicy({...newPolicy, daysPerYear: e.target.value})} placeholder="e.g. 15" className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-black text-sm transition-colors" required min="1" step="0.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">Paid Leave</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">Employees receive normal pay.</p>
                      </div>
                      <button type="button" onClick={() => setNewPolicy({...newPolicy, isPaid: !newPolicy.isPaid})} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newPolicy.isPaid ? 'bg-black' : 'bg-neutral-200'}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newPolicy.isPaid ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                      <div className="flex-1 mr-4">
                        <h4 className="text-sm font-bold text-neutral-900">Carry Forward</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">Rollover unused days to next year.</p>
                        {newPolicy.carryForward && (
                          <input type="number" value={newPolicy.maxCarryForward} onChange={(e) => setNewPolicy({...newPolicy, maxCarryForward: e.target.value})} placeholder="Max days (e.g. 5)" className="mt-3 w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-black outline-none" min="1" required />
                        )}
                      </div>
                      <button type="button" onClick={() => setNewPolicy({...newPolicy, carryForward: !newPolicy.carryForward})} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start mt-1 ${newPolicy.carryForward ? 'bg-black' : 'bg-neutral-200'}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newPolicy.carryForward ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={policySaving} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-bold disabled:opacity-50 active:scale-95">
                      {policySaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Policy
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center gap-2.5 bg-neutral-50/50">
                  <h2 className="font-bold text-neutral-900">Active Policies ({leavePolicies.length})</h2>
                </div>
                <div className="divide-y divide-neutral-100 min-h-[100px]">
                  {loadingPolicies ? (
                    <div className="p-8 flex justify-center text-neutral-400"><Loader2 className="animate-spin" /></div>
                  ) : leavePolicies.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">No leave policies defined yet.</div>
                  ) : (
                    leavePolicies.map(policy => (
                      <div key={policy.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${!policy.isActive ? 'bg-neutral-50/50 opacity-75' : 'hover:bg-neutral-50/80 group'}`}>
                        <div>
                          <h3 className="font-bold text-neutral-900 text-base flex items-center gap-2">
                            {policy.name} 
                            {!policy.isActive && <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Inactive</span>}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md w-fit">
                              {policy.daysPerYear} Days/Yr
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${policy.isPaid ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                              {policy.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            {policy.carryForward && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                                Rollover: {policy.maxCarryForward} Days
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleTogglePolicyStatus(policy.id, policy.isActive)} 
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${policy.isActive ? 'text-neutral-500 border-neutral-200 hover:bg-neutral-100' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                          >
                            {policy.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeletePolicy(policy.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete Policy">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {/* --- ROLES & PERMISSIONS TAB REDIRECT --- */}
          {activeTab === 'permissions' && (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden h-[400px] flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <ShieldCheck size={28} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Advanced RBAC Management</h3>
              <p className="text-sm text-neutral-500 mt-2 max-w-sm mb-6">
                Role management has been securely sandboxed to a dedicated control panel for granular module permissions.
              </p>
              <button 
                onClick={() => router.push('/configuration/roles')}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-lg hover:bg-neutral-800 transition-colors shadow-md active:scale-95"
              >
                Go to RBAC Control Panel <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Pending Tabs */}
          {activeTab !== 'general' && activeTab !== 'rooms' && activeTab !== 'permissions' && activeTab !== 'leave' && activeTab !== 'users' && (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                {ActiveIcon && <ActiveIcon size={28} className="text-neutral-300" />}
              </div>
              <h3 className="text-lg font-bold text-neutral-700">{ActiveTabObj?.label} Configurations</h3>
              <p className="text-sm text-neutral-400 mt-2 max-w-sm">This administrative module is currently being built.</p>
            </div>
          )}

        </div>
      </div>
      
      {/* Modals remain structurally identical */}
      {isProvisionModalOpen && (
        <ProvisionUserModal 
          isOpen={isProvisionModalOpen} 
          onClose={() => setIsProvisionModalOpen(false)} 
          onSuccess={(newUser: any) => {
            setUsers([newUser, ...users]);
            setIsProvisionModalOpen(false);
          }} 
          employees={unprovisionedEmployees} 
        />
      )}

      {userToEdit && (
        <EditUserModal 
          isOpen={!!userToEdit} 
          user={userToEdit}
          onClose={() => setUserToEdit(null)} 
          onSuccess={(updatedUser: any) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setUserToEdit(null);
          }} 
        />
      )}

    </div>
  );
}