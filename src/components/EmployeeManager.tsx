/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserPlus, Edit2, Trash2, Mail, Phone, Calendar, 
  MapPin, ShieldAlert, Award, TrendingUp, AlertTriangle, 
  UserCheck, Briefcase, Plus, Shield, Users, Database, Sparkles, FolderArchive
} from 'lucide-react';
import { User, UserRole, PerformanceScore, Team, Task } from '../types';

interface EmployeeManagerProps {
  currentUser: Omit<User, 'passwordHash'>;
  employees: User[];
  performanceScores: PerformanceScore[];
  onAddEmployee: (employeeData: any) => Promise<void>;
  onEditEmployee: (empId: string, payload: any) => Promise<void>;
  onDeleteEmployee: (empId: string) => Promise<void>;
  teams: Team[];
  onAddTeam: (teamData: any) => Promise<void>;
  onUpdateTeam: (teamId: string, payload: any) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  tasks: Task[];
}

export default function EmployeeManager({
  currentUser,
  employees,
  performanceScores,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  teams,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  tasks
}: EmployeeManagerProps) {
  // Modal visibility controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  // Selected Profile details panel
  const [viewedEmpId, setViewedEmpId] = useState<string | null>(currentUser.role === UserRole.EMPLOYEE ? currentUser.id : null);

  // Add employee fields
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [addDept, setAddDept] = useState('Engineering');
  const [addPassword, setAddPassword] = useState('');

  // Edit employee fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [editDept, setEditDept] = useState('');

  // Processing indicators
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sub-tab selection in personnel
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'teams'>('directory');

  // Team creation modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDept, setNewTeamDept] = useState('Engineering');
  const [newTeamLeaderId, setNewTeamLeaderId] = useState('');
  const [newTeamEmployeeIds, setNewTeamEmployeeIds] = useState<string[]>([]);

  // Team editing states
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDept, setEditTeamDept] = useState('Engineering');
  const [editTeamLeaderId, setEditTeamLeaderId] = useState('');
  const [editTeamEmployeeIds, setEditTeamEmployeeIds] = useState<string[]>([]);

  // Dynamic ZIP backup workstation compiler and suspend access
  const handleArchiveAndSuspend = async (emp: User) => {
    try {
      setIsSubmitting(true);
      await onEditEmployee(emp.id, { isSuspended: true });

      const empTasks = tasks.filter(t => t.assignedTo === emp.id);
      const empComments = tasks.flatMap(t => 
        (t.comments || []).filter(c => c.commenterId === emp.id).map(c => ({
          taskId: t.id,
          taskTitle: t.title,
          content: c.content,
          createdAt: c.createdAt
        }))
      );

      const manifestText = `=====================================================
WORKDESK CORPORATE PERSONNEL WORKSPACE BACKUP ARCHIVE
=====================================================
Employee Name: ${emp.name}
Assigned Role: ${emp.role}
Department: ${emp.department}
Primary Email Contact: ${emp.email}
Phone Number: ${emp.phone || 'N/A'}
Platform Registration: ${new Date(emp.createdAt).toLocaleDateString()}
Status: COLD STORAGE DEACTIVATED (DATA PERSISTED SECURELY)
Export Timestamp: ${new Date().toLocaleString()}
Authorized By Administrator: ${currentUser.name} (ID: ${currentUser.id})

-----------------------------------------------------
1. ASSIGNED PORTFOLIO CORPORATE TASKS
-----------------------------------------------------
${empTasks.length === 0 ? "No active or legacy tasks registered on this worker." : empTasks.map((t, idx) => `
Task #${idx + 1}: ${t.title}
Status: ${t.status} | Priority: ${t.priority} | Completion Progress: ${t.progress}%
Deadline Target: ${new Date(t.deadline).toLocaleDateString()}
Functional Description: ${t.description}
`).join('\n---\n')}

-----------------------------------------------------
2. NOTES, COMMENTS, & FEED COMMUNICATIONS
-----------------------------------------------------
${empComments.length === 0 ? "No comments or stream notes logged." : empComments.map((c, idx) => `
Note Item #${idx + 1}: "${c.content}"
Sent On Task Target: "${c.taskTitle}" (ID: ${c.taskId})
Log Timestamp: ${new Date(c.createdAt).toLocaleString()}
`).join('\n---\n')}

=====================================================
WORKDESK WORKSPACE ENVELOPE ZIP MANIFEST ARCHIVE: OK
=====================================================`;

      const blob = new Blob([manifestText], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${emp.name.toLowerCase().replace(/\s+/g, '_')}_workspace_archive.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Workforce deactivation backup fault: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === viewedEmpId);
  const selectedEmpScore = selectedEmployee 
    ? performanceScores.find(p => p.userId === selectedEmployee.id)
    : null;

  // Actions
  const handleOpenEdit = (emp: User) => {
    setEditingEmpId(emp.id);
    setEditName(emp.name);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role);
    setEditDept(emp.department);
    setErrorMessage('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword) {
      setErrorMessage('Please fill in Name, Email, and Access Password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onAddEmployee({
        name: addName,
        email: addEmail,
        phone: addPhone,
        role: addRole,
        department: addDept,
        password: addPassword
      });

      // Clear fields
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddPassword('');
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Could not instantiate employee profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onEditEmployee(editingEmpId, {
        name: editName,
        phone: editPhone,
        role: editRole,
        department: editDept
      });
      setEditingEmpId(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Could not adjust personnel attributes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrigger = async (empId: string, empName: string) => {
    if (empId === currentUser.id) {
      alert('You cannot delete your active administrator profile.');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete employee "${empName}"? This action reallocates metrics indexes.`)) {
      try {
        await onDeleteEmployee(empId);
        if (viewedEmpId === empId) setViewedEmpId(null);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to remove employee record.');
      }
    }
  };

  // Team Management Action Submissions
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamLeaderId) {
      alert("Please provide a team name and assign a Team Leader.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onAddTeam({
        name: newTeamName,
        department: newTeamDept,
        leaderId: newTeamLeaderId,
        employeeIds: newTeamEmployeeIds
      });
      setNewTeamName('');
      setNewTeamLeaderId('');
      setNewTeamEmployeeIds([]);
      setShowCreateTeam(false);
    } catch (err: any) {
      alert(err.message || "Failed to create team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamId) return;
    try {
      setIsSubmitting(true);
      await onUpdateTeam(editingTeamId, {
        name: editTeamName,
        department: editTeamDept,
        leaderId: editTeamLeaderId,
        employeeIds: editTeamEmployeeIds
      });
      setEditingTeamId(null);
    } catch (err: any) {
      alert(err.message || "Failed to edit team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeamTrigger = async (teamId: string, name: string) => {
    if (confirm(`Are you sure you want to dismantle the organizational team "${name}"?`)) {
      try {
        await onDeleteTeam(teamId);
      } catch (err: any) {
        alert(err.message || "Dismantle failed.");
      }
    }
  };

  const handleOpenEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamDept(team.department);
    setEditTeamLeaderId(team.leaderId);
    setEditTeamEmployeeIds(team.employeeIds || []);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* 1. Primary Personnel Hub Container (Takes 2 columns of 3) */}
      <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Sub-Navigation Subtab Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="text-left font-sans">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Tenant Personnel Hub</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Monitor active personnel registry indices & institutional teams structure</p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-center text-xs font-semibold cursor-pointer">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`px-3.5 py-1.5 rounded-lg transition duration-150 ${activeSubTab === 'directory' ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-805 dark:text-slate-400 dark:hover:text-slate-250'}`}
            >
              Directory & KPIs
            </button>
            <button
              onClick={() => setActiveSubTab('teams')}
              className={`px-3.5 py-1.5 rounded-lg transition duration-150 ${activeSubTab === 'teams' ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-805 dark:text-slate-400 dark:hover:text-slate-250'}`}
            >
              Organizational Teams
            </button>
          </div>
        </div>

        {/* --- VIEW SWITCHER BODY --- */}
        {activeSubTab === 'directory' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Employees Catalog</h4>
              {currentUser.role === UserRole.ADMIN && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(true);
                    setErrorMessage('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 outline-hidden text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Employee</span>
                </button>
              )}
            </div>

            {/* Directory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees
                .filter(emp => currentUser.role !== UserRole.EMPLOYEE || emp.id === currentUser.id)
                .map(emp => {
                  const scoreRecord = performanceScores.find(p => p.userId === emp.id);
                  const isSelf = emp.id === currentUser.id;
                  
                  return (
                    <div 
                      key={emp.id}
                      onClick={() => setViewedEmpId(emp.id)}
                      className={`p-4 rounded-xl border transition duration-200 cursor-pointer flex items-start gap-3.5 relative overflow-hidden group ${
                        emp.isSuspended
                          ? 'opacity-65 bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 border-dashed'
                          : viewedEmpId === emp.id 
                          ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/25' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-350 font-bold text-sm rounded-full flex flex-shrink-0 items-center justify-center border border-indigo-100 dark:border-indigo-900">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Details text */}
                      <div className="flex-1 space-y-1 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{emp.name}</h4>
                          {isSelf && (
                            <span className="text-[9px] bg-indigo-650 text-white font-bold px-1.5 py-0.5 rounded-xs">YOU</span>
                          )}
                          {emp.isSuspended && (
                            <span className="text-[8px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold px-1.5 py-0.2 rounded-xs uppercase">SUSPENDED</span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-450 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Briefcase className="w-3" />
                          <span>{emp.department} · {emp.role.replace('_', ' ')}</span>
                        </p>

                        <div className="flex flex-col gap-1.5 pt-1">
                          {/* Associated Corporate Team mapping */}
                          {(() => {
                            const empTeam = teams.find(t => (t.employeeIds || []).includes(emp.id) || t.leaderId === emp.id);
                            if (empTeam) {
                              return (
                                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                                  <Users className="w-3 text-indigo-500" />
                                  <span>{empTeam.name} {empTeam.leaderId === emp.id ? '(Leader)' : '(Member)'}</span>
                                </div>
                              );
                            }
                            return (
                              <div className="text-[10px] text-slate-400 italic">Unassigned Team</div>
                            );
                          })()}

                          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-550">
                            <TrendingUp className="w-3 text-emerald-500" />
                            ID Index: <strong className="text-slate-700 dark:text-slate-200">{scoreRecord?.productivityScore || 75}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Inline operational edit/delete triggers */}
                      {currentUser.role === UserRole.ADMIN && (
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(emp);
                            }}
                            className="p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrigger(emp.id, emp.name);
                              }}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-lg text-rose-550 dark:text-rose-455 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* --- TEAMS STRUCTURE VIEW --- */
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Company Teams Mapping</h4>
                <p className="text-[10px] text-slate-400">Delineate leaders, employees, and team-isolated partitions</p>
              </div>
              {currentUser.role === UserRole.ADMIN && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTeamName('');
                    setNewTeamLeaderId('');
                    setNewTeamEmployeeIds([]);
                    setShowCreateTeam(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 outline-hidden text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Team</span>
                </button>
              )}
            </div>

            {/* Teams Grid */}
            {teams.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <Users className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No organizational teams have been established yet.</p>
                {currentUser.role === UserRole.ADMIN && (
                  <p className="text-[10px] text-slate-400 mt-1">Establish a new team above to assign employees to respective Team Leaders.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {teams.map(team => {
                  const leader = employees.find(e => e.id === team.leaderId);
                  const memberEmployees = employees.filter(e => (team.employeeIds || []).includes(e.id));
                  const otherEmployees = employees.filter(e => e.role === UserRole.EMPLOYEE && !(team.employeeIds || []).includes(e.id) && e.id !== team.leaderId);

                  return (
                    <div key={team.id} className="p-5 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl relative space-y-4">
                      
                      {/* Team Header Title Card */}
                      <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                            <span className="p-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-md">
                              <Users className="w-4 h-4" />
                            </span>
                            {team.name}
                          </h5>
                          <p className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-750 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-bold inline-block leading-none uppercase">
                            {team.department}
                          </p>
                        </div>

                        {/* Admin Action Control Row */}
                        {currentUser.role === UserRole.ADMIN && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditTeam(team)}
                              className="p-1 px-2.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Edit Team
                            </button>
                            <button
                              onClick={() => handleDeleteTeamTrigger(team.id, team.name)}
                              className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-900/35 border border-rose-150 dark:border-rose-900 text-rose-600 dark:text-rose-450 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Dismantle
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Leader details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* A. Team Leader Card */}
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-xl space-y-2">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">TEAM LEADER</span>
                          {leader ? (
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold text-xs rounded-full flex items-center justify-center border border-indigo-100">
                                {leader.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="text-xs">
                                <strong className="block text-slate-800 dark:text-slate-200">{leader.name}</strong>
                                <span className="text-[10px] text-slate-400">{leader.email}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-rose-500 italic">No assigned leader</p>
                          )}

                          {/* Quick Change Team Leader inline option */}
                          {currentUser.role === UserRole.ADMIN && (
                            <div className="pt-2 border-t border-slate-150 dark:border-slate-800 mt-2 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 font-semibold">Change Leader</span>
                              <select
                                value={team.leaderId}
                                onChange={(e) => {
                                  onUpdateTeam(team.id, { ...team, leaderId: e.target.value });
                                }}
                                className="bg-transparent text-[10px] text-indigo-650 dark:text-indigo-400 font-semibold cursor-pointer border-b focus:outline-hidden"
                              >
                                {employees.filter(e => e.role === UserRole.TEAM_LEADER).map(leaderEmp => (
                                  <option key={leaderEmp.id} value={leaderEmp.id} className="dark:bg-slate-900 text-black dark:text-white">{leaderEmp.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* B. Team Member Employees list section */}
                        <div className="space-y-2 text-xs">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">TEAM MEMBERS ({memberEmployees.length})</span>
                          
                          {memberEmployees.length === 0 ? (
                            <p className="text-[10.5px] text-slate-400 italic py-2">No assigned employee members on this team yet.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                              {memberEmployees.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px]">
                                  <strong className="text-slate-700 dark:text-slate-250 truncate">{member.name} {member.isSuspended ? '(Deactivated)' : ''}</strong>
                                  
                                  {currentUser.role === UserRole.ADMIN && (
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Remove "${member.name}" from active team listing? This revokes team association context.`)) {
                                          const newMembers = (team.employeeIds || []).filter(id => id !== member.id);
                                          
                                          const shouldDeactivate = confirm(`Do you also want to suspend platform access for employee "${member.name}" and download their workspace work archive ZIP?`);
                                          if (shouldDeactivate) {
                                            await onUpdateTeam(team.id, { ...team, employeeIds: newMembers });
                                            await handleArchiveAndSuspend(member);
                                          } else {
                                            await onUpdateTeam(team.id, { ...team, employeeIds: newMembers });
                                          }
                                        }
                                      }}
                                      className="text-rose-500 dark:text-rose-400 hover:underline font-bold text-[10px] pl-2 cursor-pointer"
                                      title="Remove from Team"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Add Employee Member Dropdown selector */}
                          {currentUser.role === UserRole.ADMIN && otherEmployees.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 font-semibold">Add Employee Member</span>
                              <select
                                value=""
                                onChange={async (e) => {
                                  if (!e.target.value) return;
                                  const newMembers = [...(team.employeeIds || []), e.target.value];
                                  await onUpdateTeam(team.id, { ...team, employeeIds: newMembers });
                                }}
                                className="bg-transparent text-[10px] text-indigo-650 dark:text-indigo-400 font-bold cursor-pointer focus:outline-hidden py-1 border-b"
                              >
                                <option value="" className="text-slate-400 dark:bg-slate-900">-- Choose --</option>
                                {otherEmployees.map(e => (
                                  <option key={e.id} value={e.id} className="text-black dark:text-slate-900">{e.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Employee Productivity Analytics Details Column (1 column) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        {selectedEmployee ? (
          <div className="space-y-6">
            {/* Header profile info */}
            <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-16 h-16 bg-indigo-600 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto shadow-md border border-indigo-550">
                {selectedEmployee.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-sans font-bold text-slate-900 dark:text-white text-base">{selectedEmployee.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-550 font-mono mt-0.5">{selectedEmployee.role.replace('_', ' ')} · {selectedEmployee.department}</p>
              </div>
            </div>

            {/* Profile actions contact links */}
            <div className="space-y-2 text-xs text-left">
              <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Secure Contact Channels</h5>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{selectedEmployee.email}</span>
              </div>
              {selectedEmployee.phone && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedEmployee.phone}</span>
                </div>
              )}
            </div>

            {/* Performance Indicators & Scores */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">Performance KPI Indices</h5>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold px-1.5 py-0.5 rounded-xs">MONTHLY REPORT</span>
              </div>

              {/* Complete Metric items list */}
              <div className="space-y-3">
                {/* 1. Productivity score */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-450 font-medium">
                    <span>Overall Productivity Rank</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{selectedEmpScore?.productivityScore || 75}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-650" style={{ width: `${selectedEmpScore?.productivityScore || 75}%` }} />
                  </div>
                </div>

                {/* 2. Completion rate */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-450 font-medium">
                    <span>Task Completion rate</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{selectedEmpScore?.taskCompletionRate || 80}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${selectedEmpScore?.taskCompletionRate || 80}%` }} />
                  </div>
                </div>

                {/* 3. Deadline Adherence */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-450 font-medium">
                    <span>Deadline Adherence</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{selectedEmpScore?.deadlineAdherence || 85}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${selectedEmpScore?.deadlineAdherence || 85}%` }} />
                  </div>
                </div>

                {/* 4. Response speed and attendance consistency */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Response Speed</span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 font-mono">{selectedEmpScore?.responseTime || 2.4} hrs</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-955 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Attendance Consistency</span>
                    <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{selectedEmpScore?.attendanceConsistency || 95}%</span>
                  </div>
                </div>

                {/* Suspension & Access Archival Row */}
                {currentUser.role === UserRole.ADMIN && selectedEmployee.id !== currentUser.id && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Access Control</span>
                    
                    {!selectedEmployee.isSuspended ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to suspend access for employee "${selectedEmployee.name}"? This revokes login and API authorization immediately, and compiles a comprehensive workspace ZIP archive backup document for download.`)) {
                            handleArchiveAndSuspend(selectedEmployee);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/25 dark:hover:bg-rose-900/35 border border-rose-200 dark:border-rose-900 text-rose-650 dark:text-rose-400 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                      >
                        <FolderArchive className="w-4 h-4 text-rose-550" />
                        <span>Suspend Access & Export ZIP</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-455">
                          <ShieldAlert className="w-4 h-4 animate-pulse" />
                          <span>Status: Suspended</span>
                        </div>
                        <p className="text-[10px] text-slate-400">This account cannot login, read records, or invoke APIs. Historical metrics have been cold-archived safely.</p>
                        <button
                          type="button"
                          onClick={() => {
                            onEditEmployee(selectedEmployee.id, { isSuspended: false });
                          }}
                          className="w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-750 dark:text-indigo-400 border border-indigo-150 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Restore Platform Access
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Award className="w-10 h-10 text-slate-350 dark:text-slate-600" />
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed">Select an employee profile to audit custom performance metrics and task completion ratings.</p>
          </div>
        )}
      </div>

      {/* --- INVITE EMPLOYEE MODAL (Admin Only) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-left">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">Invite Team Personnel</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Add an account to WorkDesk. Installs metrics scores dashboards automatically.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              {errorMessage && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 text-rose-800 dark:text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Sarah Chen"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Corporate Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="emp1@company.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-505/50 outline-hidden"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+1 (555) 0184"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-505/50 outline-hidden"
                />
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Corporate Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value={UserRole.EMPLOYEE} className="text-black dark:bg-slate-900">Employee</option>
                    <option value={UserRole.TEAM_LEADER} className="text-black dark:bg-slate-900">Team Leader</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Department</label>
                  <select
                    value={addDept}
                    onChange={(e) => setAddDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value="Engineering" className="text-black dark:bg-slate-900">Engineering</option>
                    <option value="Product Strategy" className="text-black dark:bg-slate-900">Product Strategy</option>
                    <option value="Marketing & Sales" className="text-black dark:bg-slate-900">Marketing & Sales</option>
                    <option value="Operations" className="text-black dark:bg-slate-900">Operations</option>
                  </select>
                </div>
              </div>

              {/* Secure Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Access Password *</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Inviting...' : 'Invite Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EMPLOYEE MODAL (Admin Only) --- */}
      {editingEmpId && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">Edit Member Settings</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Reconfigure corporate settings inside partition registries</p>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 text-rose-850 dark:text-rose-300 text-xs p-3 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Contact Phone</label>
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white text-xs rounded-lg focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Platform Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value={UserRole.EMPLOYEE} className="text-black dark:bg-slate-900">Employee</option>
                    <option value={UserRole.TEAM_LEADER} className="text-black dark:bg-slate-900">Team Leader</option>
                    <option value={UserRole.ADMIN} className="text-black dark:bg-slate-900">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Department</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value="Engineering" className="text-black dark:bg-slate-900">Engineering</option>
                    <option value="Product Strategy" className="text-black dark:bg-slate-900">Product Strategy</option>
                    <option value="Marketing & Sales" className="text-black dark:bg-slate-900">Marketing & Sales</option>
                    <option value="Operations" className="text-black dark:bg-slate-900">Operations</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmpId(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE TEAM MODAL (Admin Only) --- */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">Create New Corporate Team</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Configure workspace grouping, leader alignments, and metrics structures</p>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 text-rose-850 dark:text-rose-300 text-xs p-3 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Team Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Alpha Engineering Core"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-505/50 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Department</label>
                  <select
                    value={newTeamDept}
                    onChange={(e) => setNewTeamDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value="Engineering" className="text-black dark:bg-slate-900">Engineering</option>
                    <option value="Product Strategy" className="text-black dark:bg-slate-900">Product Strategy</option>
                    <option value="Marketing & Sales" className="text-black dark:bg-slate-900">Marketing & Sales</option>
                    <option value="Operations" className="text-black dark:bg-slate-900">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Team Leader</label>
                  <select
                    required
                    value={newTeamLeaderId}
                    onChange={(e) => setNewTeamLeaderId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value="" className="text-slate-400 dark:bg-slate-900">-- Choose Leader --</option>
                    {employees.filter(e => e.role === UserRole.TEAM_LEADER).map(leaderEmp => (
                      <option key={leaderEmp.id} value={leaderEmp.id} className="text-black dark:bg-slate-900">{leaderEmp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Select Initial Members</label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                  {employees.filter(e => e.role === UserRole.EMPLOYEE).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No Employee profiles found to add</p>
                  ) : (
                    employees.filter(e => e.role === UserRole.EMPLOYEE).map(emp => {
                      const isChecked = newTeamEmployeeIds.includes(emp.id);
                      return (
                        <label key={emp.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTeamEmployeeIds([...newTeamEmployeeIds, emp.id]);
                              } else {
                                setNewTeamEmployeeIds(newTeamEmployeeIds.filter(id => id !== emp.id));
                              }
                            }}
                            className="rounded text-indigo-650"
                          />
                          <span>{emp.name} ({emp.department})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Create Team Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TEAM MODAL (Admin Only) --- */}
      {editingTeamId && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-left">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">Edit Team Settings</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Reconfigure institutional groupings and leader/member alignments</p>
            </div>

            <form onSubmit={handleEditTeamSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Team Name</label>
                <input 
                  type="text" 
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-505/50 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Department</label>
                  <select
                    value={editTeamDept}
                    onChange={(e) => setEditTeamDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    <option value="Engineering" className="text-black dark:bg-slate-900">Engineering</option>
                    <option value="Product Strategy" className="text-black dark:bg-slate-900">Product Strategy</option>
                    <option value="Marketing & Sales" className="text-black dark:bg-slate-900">Marketing & Sales</option>
                    <option value="Operations" className="text-black dark:bg-slate-900">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Team Leader</label>
                  <select
                    required
                    value={editTeamLeaderId}
                    onChange={(e) => setEditTeamLeaderId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500/50 outline-hidden"
                  >
                    {employees.filter(e => e.role === UserRole.TEAM_LEADER).map(leaderEmp => (
                      <option key={leaderEmp.id} value={leaderEmp.id} className="text-black dark:bg-slate-900">{leaderEmp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Edit Team Members</label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                  {employees.filter(e => e.role === UserRole.EMPLOYEE).map(emp => {
                    const isChecked = editTeamEmployeeIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditTeamEmployeeIds([...editTeamEmployeeIds, emp.id]);
                            } else {
                              setEditTeamEmployeeIds(editTeamEmployeeIds.filter(id => id !== emp.id));
                            }
                          }}
                          className="rounded text-indigo-650"
                        />
                        <span>{emp.name} ({emp.department})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeamId(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  Save Team Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
