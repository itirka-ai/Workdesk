/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, Filter, Play, CheckCircle, FileText, Clock, 
  ChevronRight, AlertCircle, Plus, Sparkles, MessageSquare, 
  Paperclip, Trash2, ArrowRight, CornerDownRight, Download 
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, User, UserRole, Notification } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  employees: User[];
  currentUser: Omit<User, 'passwordHash'>;
  onUpdateTask: (taskId: string, payload: any) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onOpenCreateTaskDialog?: () => void;
  focusedTaskId?: string | null;
  onClearFocusedTask?: () => void;
  teams?: any[];
  notifications?: Notification[];
}

export default function TaskBoard({
  tasks,
  employees,
  currentUser,
  onUpdateTask,
  onDeleteTask,
  onOpenCreateTaskDialog,
  focusedTaskId,
  onClearFocusedTask,
  teams,
  notifications
}: TaskBoardProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Selected active task details drawer
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  // Custom mock upload state fields
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Auto focus binding for redirected workspace items
  React.useEffect(() => {
    if (focusedTaskId) {
      setSelectedTaskId(focusedTaskId);
      onClearFocusedTask?.();
    }
  }, [focusedTaskId, onClearFocusedTask]);

  const hasUnreadNotification = (task: Task) => {
    if (!notifications) return false;
    return notifications.some(n => 
      !n.isRead && 
      (n.title.toLowerCase().includes(task.title.toLowerCase()) || 
       n.message.toLowerCase().includes(task.title.toLowerCase()) ||
       task.title.toLowerCase().includes(n.title.replace('New Task Assigned: ', '').toLowerCase()))
    );
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Helper getters
  const getAssigneeName = (userId: string) => {
    const found = employees.find(e => e.id === userId);
    return found ? found.name : 'Unassigned';
  };

  const getCreatorName = (userId: string) => {
    const found = employees.find(e => e.id === userId);
    return found ? found.name : 'System Admin';
  };

  // Run filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || task.assignedTo === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Action dispatches
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await onUpdateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  const handleProgressChange = async (taskId: string, progressValue: number) => {
    try {
      await onUpdateTask(taskId, { progress: progressValue });
    } catch (err) {
      console.error('Failed to change progress', err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTaskId) return;

    try {
      await onUpdateTask(selectedTaskId, { commentContent: commentInput });
      setCommentInput('');
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const handleSimulatedUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !selectedTaskId) return;

    try {
      setIsUploading(true);
      // Simulate network request delays
      await new Promise(resolve => setTimeout(resolve, 800));

      await onUpdateTask(selectedTaskId, {
        attachmentFile: {
          name: uploadName,
          url: '#',
          size: `${Math.floor(Math.random() * 800) + 120} KB`
        }
      });
      setUploadName('');
    } catch (err) {
      console.error('Failed to attach proof', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAttachment = (file: { name: string; url?: string }) => {
    // Generate an automatic client-side file document artifact for instant downloads
    const contentText = `--- WorkDesk Institutional File Artifact ---\nDocument Name: ${file.name}\nDownloaded At: ${new Date().toLocaleString()}\nAccess Security: Encrypted Verified\nPayload Hash: SHA-${Math.floor(Math.random() * 900000) + 100000}\n\n[Active Workplace System Artifact Content Logs]`;
    const blob = new Blob([contentText], { type: 'text/plain' });
    const localUrl = window.URL.createObjectURL(blob);
    const trigger = document.createElement('a');
    trigger.href = localUrl;
    trigger.download = file.name.includes('.') ? file.name : `${file.name}.txt`;
    document.body.appendChild(trigger);
    trigger.click();
    document.body.removeChild(trigger);
    window.URL.revokeObjectURL(localUrl);
  };

  const handleAssigneeChange = async (taskId: string, userId: string) => {
    try {
      await onUpdateTask(taskId, { assignedTo: userId });
    } catch (err) {
      console.error('Error changing assignee properties', err);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await onUpdateTask(taskId, { priority: newPriority });
    } catch (err) {
      console.error('Failed to adjust priority index', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Control Bar & Search filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Query tasks by title, criteria keywords, activity references..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 text-black dark:text-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 outline-none font-medium cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900">All States</option>
                <option value={TaskStatus.PENDING} className="bg-white dark:bg-slate-900">Pending</option>
                <option value={TaskStatus.IN_PROGRESS} className="bg-white dark:bg-slate-900">In Progress</option>
                <option value={TaskStatus.REVIEW} className="bg-white dark:bg-slate-900">In Review</option>
                <option value={TaskStatus.COMPLETED} className="bg-white dark:bg-slate-900">Completed</option>
                <option value={TaskStatus.OVERDUE} className="bg-white dark:bg-slate-900">Overdue</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Priority:</span>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 outline-none font-medium cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900">All Priorities</option>
                <option value={TaskPriority.LOW} className="bg-white dark:bg-slate-900">Low</option>
                <option value={TaskPriority.MEDIUM} className="bg-white dark:bg-slate-900">Medium</option>
                <option value={TaskPriority.HIGH} className="bg-white dark:bg-slate-900">High</option>
                <option value={TaskPriority.CRITICAL} className="bg-white dark:bg-slate-900">Critical</option>
              </select>
            </div>

            {/* Employee filter (Only admins and team leaders see this) */}
            {currentUser.role !== UserRole.EMPLOYEE && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Assignee:</span>
                <select 
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 outline-none font-medium cursor-pointer max-w-[120px]"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900">All Staff</option>
                  {employees.filter(e => e.role !== 'ADMIN').map(e => (
                    <option key={e.id} value={e.id} className="bg-white dark:bg-slate-900">{e.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dispatch task button */}
            {currentUser.role !== UserRole.EMPLOYEE && onOpenCreateTaskDialog && (
              <button
                type="button"
                onClick={onOpenCreateTaskDialog}
                className="bg-indigo-600 hover:bg-indigo-700 outline-none text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-650 dark:text-slate-300 text-sm font-medium">No tasks found matching current active filters.</p>
            <p className="text-slate-400 text-xs mt-1">Try relaxing search bounds or assign new parameters.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED;
            return (
              <div 
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Visual Unresolved Activity Pulsing Dot */}
                {hasUnreadNotification(task) && (
                  <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5 z-10" title="New Activity / Unread Notification">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
                {/* Priority Flag */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm tracking-wider uppercase ${
                    task.priority === TaskPriority.CRITICAL ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60' :
                    task.priority === TaskPriority.HIGH ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/60' :
                    task.priority === TaskPriority.MEDIUM ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60' :
                    'bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 border border-slate-150 dark:border-slate-850'
                  }`}>
                    {task.priority === TaskPriority.CRITICAL && '⚠️ CRITICAL'}
                    {task.priority === TaskPriority.HIGH && '🔥 HIGH'}
                    {task.priority === TaskPriority.MEDIUM && '⚡ MEDIUM'}
                    {task.priority === TaskPriority.LOW && '🟢 LOW'}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide ${
                    task.status === TaskStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
                    task.status === TaskStatus.REVIEW ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' :
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 animate-pulse' :
                    isOverdue ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold' :
                    'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                  }`}>
                    {task.status === TaskStatus.COMPLETED && 'Completed'}
                    {task.status === TaskStatus.REVIEW && 'In Review'}
                    {task.status === TaskStatus.IN_PROGRESS && 'Active'}
                    {task.status === TaskStatus.PENDING && !isOverdue && 'Pending'}
                    {(task.status === TaskStatus.OVERDUE || isOverdue) && '🚨 Overdue'}
                  </span>
                </div>

                {/* Main details block */}
                <div>
                  <h4 className="font-sans font-bold text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition line-clamp-1">{task.title}</h4>
                  <p className="text-slate-450 dark:text-slate-400 text-xs leading-relaxed mt-1.5">{task.description}</p>
                </div>

                {/* Performance progress meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-405 dark:text-slate-450">
                    <span>Progress Tracker</span>
                    <span className="font-mono font-semibold">{task.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        task.status === TaskStatus.COMPLETED ? 'bg-emerald-550' :
                        task.status === TaskStatus.REVIEW ? 'bg-indigo-550' :
                        task.priority === TaskPriority.CRITICAL ? 'bg-rose-550' :
                        'bg-indigo-600'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Subfooter: Assignee details and deadline constraints */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {/* Assignee initials badge */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-350 font-bold text-xs rounded-full flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                      {getAssigneeName(task.assignedTo).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-none">{getAssigneeName(task.assignedTo)}</p>
                      <p className="text-[9px] text-slate-450 dark:text-slate-550 mt-0.5">Assigned Agent</p>
                    </div>
                  </div>

                  {/* Deadline Indicator */}
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold leading-none ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                      {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[9px] text-slate-450 mt-0.5">Deadline</span>
                  </div>
                </div>

                {/* Action arrow decoration */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 hover:text-indigo-600 text-slate-300 transition-all duration-200">
                  <ChevronRight className="w-5 h-5" />
                </span>

              </div>
            );
          })
        )}
      </div>

      {/* 3. Task Slide Drawer details panel */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Overlay backdrop */}
            <div 
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md md:max-w-xl animate-in slide-in-from-right duration-300">
                <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800">
                  
                  {/* Title Header */}
                  <div className="bg-slate-50/80 dark:bg-slate-950 px-6 py-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded-sm">{selectedTask.id}</span>
                        {selectedTask.recurringType && selectedTask.recurringType !== 'NONE' && (
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-sm flex items-center gap-0.5">
                            🔄 {selectedTask.recurringType} LOOP
                          </span>
                        )}
                      </div>
                      <h2 className="font-sans font-bold text-lg text-slate-900 dark:text-white pr-10">{selectedTask.title}</h2>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedTaskId(null)}
                      className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-805 focus:outline-hidden transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Content Body */}
                  <div className="flex-1 space-y-6 py-6 px-6 overflow-y-auto">
                    
                    {/* Descriptions */}
                    <div className="space-y-2 text-left">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assignment Specifications</h5>
                      <p className="text-sm bg-slate-55/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-slate-705 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                    </div>

                    {/* Meta Fields and Controls Matrix */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl text-left">
                      
                      {/* Assignee controls */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Assignee</span>
                        {currentUser.role === UserRole.EMPLOYEE ? (
                          <div className="text-sm font-semibold text-slate-705 dark:text-slate-200 mt-1">{getAssigneeName(selectedTask.assignedTo)}</div>
                        ) : (
                          <select
                            value={selectedTask.assignedTo}
                            onChange={(e) => handleAssigneeChange(selectedTask.id, e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-755 dark:text-slate-205 border-b border-slate-200 dark:border-slate-800 py-1 focus:outline-hidden cursor-pointer"
                          >
                            {employees.filter(e => e.role !== 'ADMIN').map(e => (
                              <option key={e.id} value={e.id} className="bg-white dark:bg-slate-900">{e.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* State status selector controls */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Task Status</span>
                        <select
                          value={selectedTask.status}
                          onChange={(e) => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                          className="bg-transparent text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-800 py-1 focus:outline-hidden cursor-pointer"
                        >
                          <option value={TaskStatus.PENDING} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Pending</option>
                          <option value={TaskStatus.IN_PROGRESS} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">In Progress</option>
                          <option value={TaskStatus.REVIEW} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">In Review</option>
                          <option value={TaskStatus.COMPLETED} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Completed</option>
                          <option value={TaskStatus.OVERDUE} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Overdue</option>
                        </select>
                      </div>

                      {/* Priority Selector controls */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Priority Rating</span>
                        {currentUser.role === UserRole.EMPLOYEE ? (
                          <div className="text-sm font-semibold text-slate-705 dark:text-slate-200 mt-1">{selectedTask.priority}</div>
                        ) : (
                          <select
                            value={selectedTask.priority}
                            onChange={(e) => handlePriorityChange(selectedTask.id, e.target.value as TaskPriority)}
                            className="bg-transparent text-sm font-semibold text-slate-755 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800 py-1 focus:outline-hidden cursor-pointer"
                          >
                            <option value={TaskPriority.LOW} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Low</option>
                            <option value={TaskPriority.MEDIUM} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Medium</option>
                            <option value={TaskPriority.HIGH} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">High</option>
                            <option value={TaskPriority.CRITICAL} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">Critical</option>
                          </select>
                        )}
                      </div>

                      {/* Created By details */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Created By</span>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-350 mt-0.5">{getCreatorName(selectedTask.createdBy)}</div>
                      </div>
                    </div>

                    {/* Progress slider adjustment */}
                    <div className="space-y-3 p-4 bg-slate-55/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Operational Progress</span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{selectedTask.progress}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={selectedTask.progress}
                        onChange={(e) => handleProgressChange(selectedTask.id, Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                      />
                      <p className="text-[10px] text-slate-450">Slide progress bar index as benchmarks are achieved</p>
                    </div>

                    {/* Section: Upload Proofs / Attachments (Mandatory criteria) */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>Work Proof Encrypted Attachments</span>
                      </h5>

                      {/* Upload attachments lists */}
                      {selectedTask.attachments.length === 0 ? (
                        <p className="text-[11px] text-slate-400 bg-slate-50/30 dark:bg-slate-950/30 py-3 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          No electronic attachments or task artifacts registered.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedTask.attachments.map((file, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-805 px-3 py-2 rounded-xl text-xs text-slate-650 dark:text-slate-300 border border-slate-150 dark:border-slate-800 transition">
                              <span className="font-semibold line-clamp-1 flex items-center gap-1.5 max-w-[50%]">
                                <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate" title={file.name}>{file.name}</span>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400">{file.size}</span>
                                <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">by {file.uploadedBy.slice(0, 8)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(file)}
                                  className="text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-bold transition px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs hover:scale-105 transform active:scale-95"
                                  title="Download attachment to device"
                                >
                                  <Download className="w-3 h-3 text-indigo-500" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Upload interactive slot form */}
                      <form onSubmit={handleSimulatedUpload} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="File name (e.g. index-benchmarks-logs.png)"
                          value={uploadName}
                          onChange={(e) => setUploadName(e.target.value)}
                          className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50"
                        />
                        <button
                          type="submit"
                          disabled={!uploadName.trim() || isUploading}
                          className="px-3 py-2 bg-indigo-650 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                        >
                          {isUploading ? 'Uploading...' : 'Attach Proof'}
                        </button>
                      </form>
                    </div>

                    {/* Section: Task timeline Activities logs */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Activity & Verification Logs</h5>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {selectedTask.activityLogs.map((log) => (
                          <div key={log.id} className="text-xs flex gap-2">
                            <CornerDownRight className="w-4 h-4 text-slate-300 dark:text-slate-705 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-slate-600 dark:text-slate-400 leading-tight">
                                <span className="font-semibold text-slate-800 dark:text-slate-205">{log.userName}</span>: {log.action}
                              </p>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section: Task Comments messaging */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Collaborative Comments Feed</span>
                      </h5>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selectedTask.comments.length === 0 ? (
                          <p className="text-[11px] text-slate-400 bg-slate-50/20 dark:bg-slate-950/20 py-2 text-center rounded-xl">No discussion records for this item.</p>
                        ) : (
                          selectedTask.comments.map((cmt) => (
                            <div key={cmt.id} className="bg-slate-55 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{cmt.commenterName} ({cmt.commenterRole})</span>
                                <span className="text-slate-400 dark:text-slate-550 font-mono">{new Date(cmt.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{cmt.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Form */}
                      <form onSubmit={handleSubmitComment} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Discuss findings, progress blockers, indices audits..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50"
                        />
                        <button
                          type="submit"
                          disabled={!commentInput.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-xs font-semibold cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    </div>

                    {/* Purge / Remove boundaries */}
                    {currentUser.role === UserRole.ADMIN && onDeleteTask && (
                      <div className="pt-6 border-t border-rose-100 dark:border-rose-950 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Permanently delete this task definition? (This operation cannot be undone)')) {
                              onDeleteTask(selectedTask.id);
                              setSelectedTaskId(null);
                            }
                          }}
                          className="bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-955/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-450 text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge Task Definition</span>
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Inline standard X icon as we want zero errors in imports
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
