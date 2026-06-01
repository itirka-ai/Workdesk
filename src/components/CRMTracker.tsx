/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, Plus, Calendar, LogIn, Mail, 
  Phone, Server, Tag, Sparkles, MessageSquare, 
  Search, CornerDownRight, CheckCircle2, Video, 
  PhoneCall, MailOpen 
} from 'lucide-react';
import { Client, CommunicationLog } from '../types';

interface CRMTrackerProps {
  clients: Client[];
  communicationLogs: CommunicationLog[];
  onAddClient: (clientPayload: any) => Promise<void>;
  onAddLog: (logPayload: { clientId: string; mode: 'CALL' | 'EMAIL' | 'MEETING'; notes: string }) => Promise<void>;
}

export default function CRMTracker({
  clients,
  communicationLogs,
  onAddClient,
  onAddLog
}: CRMTrackerProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  // Form toggles
  const [showAddClient, setShowAddClient] = useState(false);

  // Add Client fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Log interaction fields
  const [logMode, setLogMode] = useState<'CALL' | 'EMAIL' | 'MEETING'>('CALL');
  const [logNotes, setLogNotes] = useState('');

  // Loader togglings
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedClient = clients.find(c => c.id === activeClientId);
  const associatedLogs = communicationLogs
    .filter(l => l.clientId === activeClientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filters client list
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim() || !clientIndustry.trim()) {
      setErrorMessage('Please complete all required client metadata items.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onAddClient({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        industry: clientIndustry,
        notes: clientNotes
      });

      // Clear fields
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientIndustry('');
      setClientNotes('');
      setShowAddClient(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Could not instantiate Client profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientId || !logNotes.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddLog({
        clientId: activeClientId,
        mode: logMode,
        notes: logNotes
      });
      setLogNotes('');
    } catch (err) {
      console.error('Failed to log client interaction', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* 1. Client Portfolio directories (Takes 1 column of 3) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Corporate Client Portfolio</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Search profiles, trace connection histories, and log meeting minutes</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddClient(true);
              setErrorMessage('');
            }}
            className="p-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg transition cursor-pointer border border-indigo-100/75 dark:border-indigo-950/70"
            title="Add Client Contact"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by name or industry sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 focus:outline-hidden text-slate-800 dark:text-white"
          />
        </div>

        {/* Client Items List */}
        <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1">
          {filteredClients.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No matching client logs found.</p>
          ) : (
            filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => setActiveClientId(client.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 relative ${
                  activeClientId === client.id 
                    ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/25' 
                    : 'border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/40 dark:hover:bg-slate-850/50 hover:border-slate-250 dark:hover:border-slate-755'
                }`}
              >
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5 text-left">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{client.name}</h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono tracking-wide">{client.industry}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Client logs and timeline details (2 columns of 3) */}
      <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {selectedClient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            
            {/* Left side: Profile details + interaction submission */}
            <div className="space-y-6">
              <div className="bg-slate-50/65 dark:bg-slate-950 p-4 border border-slate-205 dark:border-slate-850 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-405 border border-indigo-100 dark:border-indigo-900 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-sans font-bold text-slate-850 dark:text-white text-sm">{selectedClient.name}</h4>
                    <span className="text-[10px] text-indigo-650 dark:text-indigo-350 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 px-2 py-0.5 rounded-sm font-mono tracking-wider">{selectedClient.industry}</span>
                  </div>
                </div>

                {selectedClient.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-350 bg-white dark:bg-slate-905 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg text-left whitespace-pre-wrap">{selectedClient.notes}</p>
                )}

                <div className="grid grid-cols-1 gap-2 pt-2 text-xs text-left">
                  <div className="flex items-center gap-2 text-slate-650 dark:text-slate-350 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{selectedClient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Log Connection Wizard Form */}
              <form onSubmit={handleAddLogSubmit} className="space-y-4 text-left">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-2">Log Connection Intercept</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLogMode('CALL')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition border ${
                      logMode === 'CALL' 
                        ? 'border-indigo-605 bg-indigo-50/20 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Log</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogMode('EMAIL')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition border ${
                      logMode === 'EMAIL' 
                        ? 'border-indigo-605 bg-indigo-50/20 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <MailOpen className="w-3.5 h-3.5" />
                    <span>Email Loop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogMode('MEETING')}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition border ${
                      logMode === 'MEETING' 
                        ? 'border-indigo-605 bg-indigo-50/20 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Meeting sync</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    required
                    placeholder="Log summary, feedback metrics, scheduled operations plans, etc."
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500/50 outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!logNotes.trim() || isSubmitting}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg transition cursor-pointer text-center"
                >
                  {isSubmitting ? 'Logging...' : 'Append Log Entry'}
                </button>
              </form>
            </div>

            {/* Right side: Historical connection log timelines */}
            <div className="flex flex-col h-full overflow-hidden text-left">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3">Client Interaction History</h4>
              
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[55vh] pr-1">
                {associatedLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-205 dark:border-slate-800">
                    No historic communication logs tracked with this strategic accounts segment.
                  </p>
                ) : (
                  associatedLogs.map(log => (
                    <div key={log.id} className="text-xs flex gap-2 border-l border-slate-200 dark:border-slate-800 pb-4 pl-3 relative">
                      {/* Interactive dot icon decoration indicating connection mode theme */}
                      <span className={`absolute -left-1.5 top-0.5 w-3.5 h-3.5 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[7px] ${
                        log.mode === 'MEETING' ? 'bg-indigo-500 text-white' :
                        log.mode === 'EMAIL' ? 'bg-blue-500 text-white' :
                        'bg-emerald-500 text-white'
                      }`}>
                        {log.mode === 'MEETING' && 'V'}
                        {log.mode === 'EMAIL' && 'E'}
                        {log.mode === 'CALL' && 'C'}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                            {log.mode} Intercept
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-xs">{log.notes}</p>
                        
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500">
                          Logged by <strong className="text-slate-650 dark:text-slate-300 font-semibold">{log.loggedByName}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700" />
            <p className="text-slate-808 dark:text-slate-200 font-bold text-sm">Select a Corporate Client Account</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm">View corporate details, map action points, review communication matrices, and log meetings syncs to client timeline directories.</p>
          </div>
        )}
      </div>

      {/* --- ADD CLIENT DIALOG DIALOG (Admin & Team Leader scope) --- */}
      {showAddClient && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-205 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh] text-left">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white">Add Corporate Client</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Create a secure strategic relationship profile to track communications interactions</p>
            </div>

            <form onSubmit={handleAddClientSubmit} className="p-6 space-y-4 overflow-y-auto">
              {errorMessage && (
                <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 text-rose-800 dark:text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Client Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Client Enterprise Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Apex Global Enterprises"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Contact Email *</label>
                <input 
                  type="email" 
                  required
                  placeholder="contact@apexglobal.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Phone and Industry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Contact Phone *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+1 (555) 0192"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Industry Segment *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Logistics Systems"
                    value={clientIndustry}
                    onChange={(e) => setClientIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* General Core Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Strategic Onboarding Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Critical accounts guidelines, security specifications, etc."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-2 text-slate-405 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Configuring...' : 'Add Client'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
