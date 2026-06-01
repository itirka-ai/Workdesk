/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, Calendar, AlertTriangle, RefreshCw, Send, CheckCircle, Paperclip, Upload, Trash2, FileText } from 'lucide-react';
import { User, TaskPriority, TaskAttachment } from '../types';

interface TaskCreationDialogProps {
  onClose: () => void;
  employees: User[];
  currentUser: Omit<User, 'passwordHash'>;
  onCreate: (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    deadline: string;
    priority: TaskPriority;
    recurringType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    isFutureScheduled: boolean;
    scheduledDate: string;
    attachments?: { name: string; url: string; size: string; uploadedBy: string; uploadedAt: string }[];
  }) => Promise<void>;
}

export default function TaskCreationDialog({ onClose, employees, currentUser, onCreate }: TaskCreationDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [recurringType, setRecurringType] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const [isFutureScheduled, setIsFutureScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  
  // Attachments State
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeEmployees = employees.filter(e => e.role !== 'ADMIN'); // Keep assignee as standard staff/leaders

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      appendFiles(e.target.files);
    }
  };

  const appendFiles = (filesList: FileList) => {
    const fresh: { name: string; size: string; url: string }[] = [];
    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i];
      // Format file size
      const sizeStr = f.size > 1024 * 1024 
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(f.size / 1024).toFixed(0)} KB`;
      
      fresh.push({
        name: f.name,
        size: sizeStr,
        url: '#' // local mock URL
      });
    }
    setAttachedFiles(prev => [...prev, ...fresh]);
  };

  const deleteAttachedFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      appendFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !assignedTo || !deadline) {
      setErrorMsg('Please complete all required fields (Title, Description, Assignee, and Deadline Date).');
      return;
    }

    if (isFutureScheduled && !scheduledDate) {
      setErrorMsg('Please specify the Scheduled Date for future release configuration.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Package attachments properly with creator trace metadata before saving
      const finalAttachments = attachedFiles.map(file => ({
        name: file.name,
        size: file.size,
        url: file.url,
        uploadedBy: currentUser.name,
        uploadedAt: new Date().toISOString()
      }));
      
      await onCreate({
        title,
        description,
        assignedTo,
        deadline: new Date(deadline).toISOString(),
        priority,
        recurringType,
        isFutureScheduled,
        scheduledDate: isFutureScheduled ? new Date(scheduledDate).toISOString() : '',
        attachments: finalAttachments
      });

      setSuccessMsg('Task assigned and instantiated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Could not dispatch task assignment pipeline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-left">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-sans font-bold text-xl text-slate-900 dark:text-white">Dispatch Task Assignment</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Instantiate a workflow with parameters, timelines, and email dispatches</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 text-rose-800 dark:text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-955/20 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Task Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="e.g., Run Multi-Tenant Migration Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition font-sans"
            />
          </div>

          {/* 2. Description Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Details & Specifications <span className="text-rose-500">*</span>
            </label>
            <textarea 
              rows={4}
              placeholder="Provide clear goals, target key indicators, indices performance checks, etc."
              value={description}
              disabled={isSubmitting}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition font-sans"
            />
          </div>

          {/* Row components: Assignee and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Associate Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={assignedTo}
                disabled={isSubmitting}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition"
              >
                <option value="" className="text-slate-450 dark:bg-slate-900">Select Assignee...</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id} className="text-black dark:bg-slate-900">
                    {emp.name} ({emp.department} - {emp.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Priority Tier <span className="text-rose-500">*</span>
              </label>
              <select
                value={priority}
                disabled={isSubmitting}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition font-semibold"
              >
                <option value={TaskPriority.LOW} className="text-black dark:bg-slate-900">🟢 LOW Priority</option>
                <option value={TaskPriority.MEDIUM} className="text-black dark:bg-slate-900">🟡 MEDIUM Priority</option>
                <option value={TaskPriority.HIGH} className="text-black dark:bg-slate-900">🟠 HIGH Priority</option>
                <option value={TaskPriority.CRITICAL} className="text-black dark:bg-slate-900">🔴 CRITICAL Priority</option>
              </select>
            </div>
          </div>

          {/* Row components: Deadline and Recurrent plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Deadline Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input 
                  type="date"
                  value={deadline}
                  disabled={isSubmitting}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Sprint Recurrence Frequency
              </label>
              <div className="relative">
                <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <select
                  value={recurringType}
                  disabled={isSubmitting}
                  onChange={(e) => setRecurringType(e.target.value as any)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition"
                >
                  <option value="NONE" className="text-black dark:bg-slate-900">Run Once (Standard)</option>
                  <option value="DAILY" className="text-black dark:bg-slate-900">Daily Loop Automation</option>
                  <option value="WEEKLY" className="text-black dark:bg-slate-900">Weekly Sprint Repeat</option>
                  <option value="MONTHLY" className="text-black dark:bg-slate-900">Monthly Audit Schedule</option>
                </select>
              </div>
            </div>
          </div>

          {/* Future Scheduling features */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-705 dark:text-slate-200">Future Scheduled Release</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Delay release queue until a specified future date parameters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isFutureScheduled}
                  disabled={isSubmitting}
                  onChange={(e) => setIsFutureScheduled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {isFutureScheduled && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  System Release Date
                </label>
                <input 
                  type="date"
                  value={scheduledDate}
                  disabled={isSubmitting}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-black dark:text-white rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 transition"
                />
              </div>
            )}
          </div>

          {/* Reference Resource Attachments section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-705 dark:text-slate-200">Starting Reference Attachments</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Provide spreadsheets, design spec papers, or guidelines on task creation</p>
            </div>

            {/* Drag & Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                dragOver 
                  ? 'border-indigo-550 bg-indigo-50/10 dark:bg-indigo-950/20 text-indigo-500' 
                  : 'border-slate-250 dark:border-slate-800 hover:border-indigo-400/60 hover:bg-slate-50/30 dark:hover:bg-slate-950/15'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden" 
              />
              <Upload className={`w-8 h-8 transition-transform duration-250 ${dragOver ? 'scale-110 text-indigo-500' : 'text-slate-400'}`} />
              <div className="text-xs text-slate-650 dark:text-slate-300">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload starting files</span> or drag and drop here
              </div>
              <p className="text-[10px] text-slate-400">Supporting DOCX, PDF, JPEG, PNG, or CSV under 20MB</p>
            </div>

            {/* List of Attachments */}
            {attachedFiles.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-xs">
                    <div className="flex items-center gap-2 max-w-[80%]">
                      <FileText className="w-4 h-4 text-slate-450 dark:text-indigo-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAttachedFile(index);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Action Controls */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/20 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-5 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-97 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-md cursor-pointer transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Task'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
