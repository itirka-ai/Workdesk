/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CheckSquare, Users, MessageSquare, 
  Bell, LogOut, Plus, Clock, AlertTriangle, TrendingUp, 
  User, Calendar, Award, ShieldAlert, Moon, Sun, 
  Briefcase, Sparkles, Building2, CheckCircle, ChevronRight,
  Key, X, FileText, CornerDownRight, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  User as UserType, Company, Task, 
  PerformanceScore, Client, CommunicationLog, 
  Notification, UserRole, TaskStatus, Team
} from './types';

// Importing Custom Sub-components
import TaskBoard from './components/TaskBoard';
import EmployeeManager from './components/EmployeeManager';
import CRMTracker from './components/CRMTracker';
import MetricsChart from './components/MetricsChart';
import TaskCreationDialog from './components/TaskCreationDialog';
import LandingPage from './components/LandingPage';

// Simple API fetching helper managing authorization payloads automatically
const API = {
  getHeaders: () => {
    const token = localStorage.getItem('workdesk_jwt');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...API.getHeaders(),
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData } };
    }

    return response.json();
  }
};

export default function App() {
  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<Omit<UserType, 'passwordHash'> | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Security password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sign-in or sign-up switch
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration fields
  const [regCompany, setRegCompany] = useState('');
  const [regDomain, setRegDomain] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regAdminEmail, setRegAdminEmail] = useState('');
  const [regAdminPassword, setRegAdminPassword] = useState('');

  // Core domain records
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [performanceScores, setPerformanceScores] = useState<PerformanceScore[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'personnel' | 'crm'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [streamTab, setStreamTab] = useState<'report' | 'notes' | 'actions' | 'recent'>('report');

  // Status indicators
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // 1. Initial Handshake Check on Boot
  useEffect(() => {
    async function verifyExistingToken() {
      const storedToken = localStorage.getItem('workdesk_jwt');
      if (!storedToken) {
        setIsLoadingSession(false);
        return;
      }

      try {
        const payload = await API.request('/api/auth/me');
        setCurrentUser(payload.user);
        setCurrentCompany(payload.company);
        await reloadAllData(payload.user);
      } catch (err) {
        console.warn('Handshake invalid, clearing credentials.');
        localStorage.removeItem('workdesk_jwt');
      } finally {
        setIsLoadingSession(false);
      }
    }
    verifyExistingToken();
  }, []);

  // 2.5. Real-Time background sync polling (12s intervals)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      reloadAllData(currentUser).catch(err => console.error("Poll update error", err));
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 2. Load Core Datasets
  async function reloadAllData(user: Omit<UserType, 'passwordHash'>) {
    try {
      const [tasksRes, employeesRes, perfRes, clientsRes, logsRes, notifRes, teamsRes] = await Promise.all([
        API.request('/api/tasks'),
        API.request('/api/employees'),
        API.request('/api/performance'),
        API.request('/api/clients'),
        API.request('/api/clients/logs'),
        API.request('/api/notifications'),
        API.request('/api/teams')
      ]);

      setTasks(tasksRes);
      setEmployees(employeesRes);
      setPerformanceScores(perfRes);
      setClients(clientsRes);
      setCommunicationLogs(logsRes);
      setNotifications(notifRes);
      setTeams(teamsRes);
    } catch (e) {
      console.error('Error fetching datasets', e);
    }
  }

  // Quick multi-tenant pre-demologin utility keys
  const triggerDemoLogin = async (roleType: 'ADMIN' | 'LEADER' | 'EMPLOYEE') => {
    let email = 'admin@aether.com';
    let password = 'admin123';

    if (roleType === 'LEADER') {
      email = 'leader@aether.com';
      password = 'leader123';
    } else if (roleType === 'EMPLOYEE') {
      email = 'emp1@aether.com';
      password = 'emp123';
    }

    try {
      setAuthError('');
      setIsSubmittingAuth(true);
      const res = await API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('workdesk_jwt', res.token);
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
      await reloadAllData(res.user);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Failed to authenticate trigger credentials.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError('Please complete email and password forms.');
      return;
    }

    try {
      setAuthError('');
      setIsSubmittingAuth(true);
      const res = await API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      localStorage.setItem('workdesk_jwt', res.token);
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
      await reloadAllData(res.user);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompany || !regDomain || !regAdminName || !regAdminEmail || !regAdminPassword) {
      setAuthError('All registration parameters are required.');
      return;
    }

    try {
      setAuthError('');
      setIsSubmittingAuth(true);
      const res = await API.request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          companyName: regCompany,
          companyDomain: regDomain,
          adminName: regAdminName,
          adminEmail: regAdminEmail,
          adminPassword: regAdminPassword
        })
      });

      localStorage.setItem('workdesk_jwt', res.token);
      setCurrentUser(res.user);
      setCurrentCompany(res.company);
      await reloadAllData(res.user);
      setAuthSuccessMsg('New enterprise tenant instantiated successfully!');
      setTimeout(() => {
        setAuthSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Failed configuration for company workspace.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('workdesk_jwt');
    setCurrentUser(null);
    setCurrentCompany(null);
    setActiveTab('dashboard');
  };

  // 3. Operational task dispatches
  const handleTaskCreation = async (taskPayload: any) => {
    const newTask = await API.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskPayload)
    });
    setTasks(prev => [newTask, ...prev]);
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleTaskUpdate = async (taskId: string, payload: any) => {
    const updatedTask = await API.request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    await API.request(`/api/tasks/${taskId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  // 4. Employee management dispatches
  const handleEmployeeCreation = async (payload: any) => {
    const newEmp = await API.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setEmployees(prev => [...prev, newEmp]);
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleEmployeeEdit = async (empId: string, payload: any) => {
    const edited = await API.request(`/api/employees/${empId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...edited } : e));
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleEmployeeDelete = async (empId: string) => {
    await API.request(`/api/employees/${empId}`, { method: 'DELETE' });
    setEmployees(prev => prev.filter(e => e.id !== empId));
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  // 4.5. Team organizational dispatches
  const handleTeamCreation = async (payload: any) => {
    const created = await API.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setTeams(prev => [...prev, created]);
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleTeamUpdate = async (teamId: string, payload: any) => {
    const updated = await API.request(`/api/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setTeams(prev => prev.map(t => t.id === teamId ? updated : t));
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleTeamDelete = async (teamId: string) => {
    await API.request(`/api/teams/${teamId}`, { method: 'DELETE' });
    setTeams(prev => prev.filter(t => t.id !== teamId));
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  // 5. Client dispatches
  const handleClientAdd = async (payload: any) => {
    const newCli = await API.request('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setClients(prev => [...prev, newCli]);
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  const handleClientLogAdd = async (payload: any) => {
    const newLog = await API.request('/api/clients/logs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setCommunicationLogs(prev => [newLog, ...prev]);
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  // 6. Notification clearances
  const markAlertRead = async (id?: string) => {
    await API.request('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (currentUser) {
      await reloadAllData(currentUser);
    }
  };

  // Secure Password Change implementation
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all security parameter forms.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The confirmed password does not match the new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Your new password must be at least 6 characters in length.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError('');
      setPasswordSuccess('');

      await API.request('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      setPasswordSuccess('Your account password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to update password inside workspace.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 7. Calculate Analytical KPI states for active dashboards
  const activeCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const pendingCount = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const reviewCount = tasks.filter(t => t.status === TaskStatus.REVIEW).length;
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const overdueCount = tasks.filter(t => {
    const isPast = new Date(t.deadline) < new Date();
    return t.status !== TaskStatus.COMPLETED && isPast;
  }).length;

  const totalEmployeesCount = employees.filter(e => e.role !== 'ADMIN').length;

  // Hydrate leaderboard structure for the Recharts graph data
  const leaderboardItems = performanceScores
    .map(score => {
      const emp = employees.find(e => e.id === score.userId);
      return {
        employeeName: emp?.name || 'Deactivated Agent',
        productivityScore: score.productivityScore,
        taskCompletionRate: score.taskCompletionRate,
        deadlineAdherence: score.deadlineAdherence,
        department: emp?.department || 'Operations'
      };
    })
    .sort((a, b) => b.productivityScore - a.productivityScore);

  // Consolidated activity timeline events
  const recentActivitiesList = tasks
    .flatMap(t => t.activityLogs.map(l => ({ ...l, taskTitle: t.title, taskId: t.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Interactive app loading gate
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest leading-none">Mapping Partition Scopes...</p>
      </div>
    );
  }

  // --- RENDERING ROUTER ---

  // 1. GUEST GATEWAYS (SIGN IN / REGISTRATION)
  if (!currentUser) {
    return (
      <LandingPage 
        onDemoLogin={triggerDemoLogin}
        onLoginSubmit={handleLoginSubmit}
        onRegisterSubmit={handleRegisterSubmit}
        authError={authError}
        authSuccessMsg={authSuccessMsg}
        isSubmittingAuth={isSubmittingAuth}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        regCompany={regCompany}
        setRegCompany={setRegCompany}
        regDomain={regDomain}
        setRegDomain={setRegDomain}
        regAdminName={regAdminName}
        setRegAdminName={setRegAdminName}
        regAdminEmail={regAdminEmail}
        setRegAdminEmail={setRegAdminEmail}
        regAdminPassword={regAdminPassword}
        setRegAdminPassword={setRegAdminPassword}
      />
    );
  }

  // 2. MAIN APPLICATION PLATFORM (USER AND TENANT LOGGED IN)
  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition duration-300 bg-[#F8FAFC] text-slate-900 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : ''}`}>
      
      {/* Sidebar navigation */}
      <aside className={`w-full md:w-64 flex flex-col bg-white text-slate-900 border-r border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800`}>
        {/* Banner header and client specs */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <div className="truncate text-left">
              <h2 className="font-sans font-bold text-xl tracking-tight text-slate-900 dark:text-white truncate">WorkDesk</h2>
              <span className="text-[10px] text-slate-500 dark:text-indigo-300 font-mono tracking-wider line-clamp-1">{currentCompany?.name}</span>
            </div>
          </div>
        </div>

        {/* Tab triggers */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg font-medium cursor-pointer transition-colors duration-150 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span>Dashboard</span>
          </button>

          {/* Tasks */}
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg font-medium cursor-pointer transition-colors duration-150 ${
              activeTab === 'tasks'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <CheckSquare className="w-5 h-5 flex-shrink-0" />
            <span>Tasks</span>
          </button>

          {/* Personnel */}
          <button
            type="button"
            onClick={() => setActiveTab('personnel')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg font-medium cursor-pointer transition-colors duration-150 ${
              activeTab === 'personnel'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span>Teams & KPIs</span>
          </button>

          {/* CRM logs */}
          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg font-medium cursor-pointer transition-colors duration-150 ${
              activeTab === 'crm'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            <span>Client Logs</span>
          </button>
        </nav>

        {/* User Card Integration and Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-3 border border-slate-100/85 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0 border-2 border-white dark:border-slate-800">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{currentUser.role.toLowerCase().replace('_', ' ')} • {currentCompany?.name}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-xl text-slate-500 transition cursor-pointer flex items-center justify-center border border-slate-150 dark:border-slate-800"
              title="Toggle theme mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-emerald-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError('');
                setPasswordSuccess('');
              }}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-xl text-slate-500 transition cursor-pointer flex items-center justify-center border border-slate-150 dark:border-slate-800"
              title="Security Settings"
            >
              <Key className="w-4 h-4 text-amber-500" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-605 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 transition cursor-pointer flex items-center justify-center gap-2 border border-slate-150 dark:border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Container */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950">
        
        {/* Top Navbar Actions */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{activeTab} Overview</h1>
            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">Live Sync Active</span>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Create Task header trigger (Admins & Lead scopes) */}
            {currentUser.role !== UserRole.EMPLOYEE && (
              <button
                type="button"
                onClick={() => setShowCreateTask(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
              >
                + Create Task
              </button>
            )}

            {/* Notifications Alert Center Trigger */}
            <button
              type="button"
              onClick={() => setShowNotifications(prev => !prev)}
              className="p-2 text-slate-450 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-full border border-slate-200 dark:border-slate-800 relative transition cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute right-1 top-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Custom Interactive Notifications Popover Menu */}
            {showNotifications && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl w-80 shadow-2xl border border-slate-100 p-4 z-50 space-y-3 float-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-705 uppercase tracking-wide">Alert Center Messages</span>
                  <button 
                    type="button"
                    onClick={() => markAlertRead()}
                    className="text-[10px] font-bold text-brand-500 hover:underline bg-transparent"
                  >
                    Clear All Read
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-60">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-450 py-4 text-center">No alert signals registered.</p>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAlertRead(notif.id)}
                        className={`p-2.5 rounded-xl text-xs space-y-1 cursor-pointer transition border border-transparent ${
                          notif.isRead 
                            ? 'bg-slate-50/50 text-slate-500' 
                            : 'bg-indigo-50/15 border-indigo-100 text-slate-805 font-medium'
                        }`}
                      >
                        <p className="leading-tight">{notif.message}</p>
                        <span className="block text-[9px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic page tab switcher */}
        <div className="p-6 flex-1 space-y-6">
          
          {/* A. DASHBOARD TAB RENDER */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Core stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                
                {/* Employees */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition duration-200">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Active Staff</h5>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalEmployeesCount}</p>
                  </div>
                </div>

                {/* Progress ratio completed */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition duration-200">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Sprint Done</h5>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{completedCount}</p>
                  </div>
                </div>

                {/* Tasks active */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition duration-200">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">In Progress</h5>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{activeCount + reviewCount}</p>
                  </div>
                </div>

                {/* Overdue alerts */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition duration-200">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">🚨 Overdue</h5>
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-500 mt-0.5">{overdueCount}</p>
                  </div>
                </div>

                {/* Total clients */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 col-span-2 md:col-span-1 transition duration-200">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-[10px] text-slate-400 dark:text-slate-550 uppercase font-bold tracking-wider">Clients Logs</h5>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{clients.length}</p>
                  </div>
                </div>
              </div>

              {/* Graphical Recharts indices */}
              {currentUser.role !== UserRole.EMPLOYEE ? (
                <MetricsChart leaderboardData={leaderboardItems} />
              ) : (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                  <div className="mb-4">
                    <h3 className="font-sans font-bold text-slate-850 dark:text-white text-lg">My Performance Indicators</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Real-time metrics of your individual workspace milestones</p>
                  </div>
                  
                  {(() => {
                    const score = performanceScores.find(p => p.userId === currentUser.id);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        {/* 1. Overall Productivity score */}
                        <div className="space-y-2 p-4 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900 text-left">
                          <div className="flex items-center justify-between text-xs text-slate-505 dark:text-slate-400 font-medium">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Overall Productivity</span>
                            <span className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">{score?.productivityScore || 75}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-150 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${score?.productivityScore || 75}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400">Aggregated based on activity consistency and milestones</p>
                        </div>

                        {/* 2. Completion rate */}
                        <div className="space-y-2 p-4 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 text-left">
                          <div className="flex items-center justify-between text-xs text-slate-505 dark:text-slate-400 font-medium">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Task Completion Rate</span>
                            <span className="text-emerald-650 dark:text-emerald-400 font-mono font-bold">{score?.taskCompletionRate || 80}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-150 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${score?.taskCompletionRate || 80}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400">Percentage of assigned tasks completed inside deadlines</p>
                        </div>

                        {/* 3. Deadline Adherence */}
                        <div className="space-y-2 p-4 bg-amber-50/20 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900 text-left">
                          <div className="flex items-center justify-between text-xs text-slate-550 dark:text-slate-400 font-medium">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Deadline Adherence</span>
                            <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">{score?.deadlineAdherence || 85}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-150 dark:bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${score?.deadlineAdherence || 85}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400">Timeliness of sprint reports and target completions</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Two columns: Task timeline actions and Overdue assignments summaries */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* System actions & Corporate activities Stream (Takes 2 columns of 3) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Corporate Activities Stream</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Real-time reports, task messages, and active priorities</p>
                    </div>

                    {/* Stream Sub-Navigation Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-750 self-start text-xs font-semibold cursor-pointer">
                      <button
                        onClick={() => setStreamTab('report')}
                        className={`px-3 py-1.5 rounded-md transition-all duration-150 ${streamTab === 'report' ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800'}`}
                      >
                        Task Report
                      </button>
                      <button
                        onClick={() => setStreamTab('notes')}
                        className={`px-3 py-1.5 rounded-md transition-all duration-150 ${streamTab === 'notes' ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800'}`}
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => setStreamTab('actions')}
                        className={`px-3 py-1.5 rounded-md transition-all duration-150 ${streamTab === 'actions' ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800'}`}
                      >
                        Action Items
                      </button>
                      <button
                        onClick={() => setStreamTab('recent')}
                        className={`px-3 py-1.5 rounded-md transition-all duration-150 ${streamTab === 'recent' ? 'bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-505 dark:text-slate-400 hover:text-slate-800'}`}
                      >
                        Logs
                      </button>
                    </div>
                  </div>

                  {/* Render Inner Stream Subtasks */}
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    
                    {/* A. TASK REPORT SUB-VIEW */}
                    {streamTab === 'report' && (
                      <div className="space-y-3">
                        {tasks.length === 0 ? (
                          <p className="text-xs text-slate-400 py-6 text-center">No assignments defined inside the organization.</p>
                        ) : (
                          tasks.map(task => {
                            const assignee = employees.find(e => e.id === task.assignedTo);
                            return (
                              <div key={task.id} className="p-3 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{task.title}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      task.status === TaskStatus.COMPLETED ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700' :
                                      task.status === TaskStatus.IN_PROGRESS ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700' :
                                      'bg-amber-100 dark:bg-amber-955/40 text-amber-700'
                                    }`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Assigned To: <strong className="text-slate-600 dark:text-slate-355">{assignee?.name || 'Unassigned'}</strong> (Role: {assignee?.role || 'Staff'})</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-1/3">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                      <span>Progress</span>
                                      <span className="font-mono font-bold text-indigo-650">{task.progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActiveTab('tasks');
                                      setFocusedTaskId(task.id);
                                    }}
                                    className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/55 transition cursor-pointer"
                                    title="View Task Details"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* B. NOTES MESSAGES STREAM */}
                    {streamTab === 'notes' && (() => {
                      const commentsStream = tasks.flatMap(t => 
                        (t.comments || []).map(c => ({
                          ...c,
                          taskTitle: t.title,
                          taskId: t.id
                        }))
                      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                      return (
                        <div className="space-y-3">
                          {commentsStream.length === 0 ? (
                            <p className="text-xs text-slate-405 py-6 text-center">No team messages or notes sent inside assignments catalog yet.</p>
                          ) : (
                            commentsStream.map(comment => {
                              const commentator = employees.find(e => e.id === comment.commenterId);
                              return (
                                <div
                                  key={comment.id}
                                  onClick={() => {
                                    setActiveTab('tasks');
                                    setFocusedTaskId(comment.taskId);
                                  }}
                                  className="p-3 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 rounded-xl text-left cursor-pointer transition duration-150 relative group"
                                >
                                  <div className="flex items-center justify-between mb-1.5 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-800 dark:text-slate-205">{comment.commenterName}</span>
                                      <span className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold uppercase">
                                        {commentator?.role || 'User'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(comment.createdAt).toLocaleTimeString()} · {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 text-xs italic line-clamp-2 pl-3 border-l-2 border-indigo-200 dark:border-indigo-805">
                                    "{comment.content}"
                                  </p>
                                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <CornerDownRight className="w-3 h-3 text-slate-400" />
                                      Refers to Task: <strong className="text-indigo-605 group-hover:underline">{comment.taskTitle}</strong>
                                    </span>
                                    <span className="text-indigo-650 opacity-0 group-hover:opacity-100 transition duration-150 font-semibold flex items-center gap-0.5">
                                      Go to Workspace <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })()}

                    {/* C. ACTION ITEMS SUB-VIEW */}
                    {streamTab === 'actions' && (
                      <div className="space-y-3">
                        {tasks.length === 0 ? (
                          <p className="text-xs text-slate-405 py-6 text-center">No action items are assigned currently.</p>
                        ) : (
                          tasks.map(task => {
                            const assignee = employees.find(e => e.id === task.assignedTo);
                            const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED;
                            return (
                              <div
                                key={task.id}
                                onClick={() => {
                                  setActiveTab('tasks');
                                  setFocusedTaskId(task.id);
                                }}
                                className={`p-3 border rounded-xl flex items-start justify-between gap-3 text-left cursor-pointer transition duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-950/25 ${
                                  isOverdue ? 'bg-rose-50/20 dark:bg-rose-955/10 border-rose-150 dark:border-rose-900/60' : 'bg-slate-50/40 dark:bg-slate-950/20 border-slate-150 dark:border-slate-800'
                                }`}
                              >
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{task.title}</span>
                                    {isOverdue && (
                                      <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-750 dark:text-rose-450 border border-rose-200 dark:border-rose-900 rounded font-bold text-[8px] uppercase tracking-wider">
                                        Overdue
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-505 dark:text-slate-400">
                                    <div>Assignee: <strong className="text-slate-700 dark:text-slate-300">{assignee?.name || 'Unassigned'}</strong></div>
                                    <div>Deadline: <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>{new Date(task.deadline).toLocaleDateString()}</strong></div>
                                  </div>
                                </div>
                                <div className="text-right flex items-center h-full">
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-750 px-2.5 py-1 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition">
                                    Open
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* D. AUDIT LOGS VIEW */}
                    {streamTab === 'recent' && (
                      <div className="space-y-3">
                        {recentActivitiesList.length === 0 ? (
                          <p className="text-xs text-slate-400 py-6 text-center">No operations logs registered for the workspace.</p>
                        ) : (
                          recentActivitiesList.map((log) => (
                            <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-b border-slate-100 dark:border-slate-800 pb-3 last:border-none text-left">
                              <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-full flex flex-shrink-0 items-center justify-center font-bold font-mono">
                                {log.userName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-slate-650 dark:text-slate-350">
                                  <strong className="text-slate-800 dark:text-white font-bold">{log.userName}</strong> verified event on <strong className="text-indigo-650 dark:text-indigo-400">{log.taskTitle}</strong>
                                </p>
                                <span className="text-xs font-semibold text-slate-400 mt-0.5">{log.action}</span>
                                <span className="block text-[9px] text-slate-300 dark:text-slate-500 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Overdue alert sidebar */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-505 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-rose-550" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-slate-900 dark:text-white text-sm">Action Items (Overdue)</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Escalate immediately to leaderboards</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {tasks.filter(t => {
                      const isPast = new Date(t.deadline) < new Date();
                      return t.status !== TaskStatus.COMPLETED && isPast;
                    }).length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl">⚡ Excellent. All assignments are inside threshold target lines!</p>
                    ) : (
                      tasks.filter(t => {
                        const isPast = new Date(t.deadline) < new Date();
                        return t.status !== TaskStatus.COMPLETED && isPast;
                      }).map(task => (
                        <div key={task.id} className="p-3 bg-rose-50/40 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900 rounded-xl flex items-start gap-2 text-xs">
                          <div className="space-y-1">
                            <h5 className="font-bold text-rose-800 dark:text-rose-300 line-clamp-1">{task.title}</h5>
                            <p className="text-[10px] text-slate-450 dark:text-slate-400 line-clamp-1">Assigned Agent: {leaderboardItems.find(i => i.employeeName === leaderboardItems.map(item => item.employeeName).find(name => name === employees.find(e => e.id === task.assignedTo)?.name))?.employeeName || 'Sarah Chen'}</p>
                            <span className="block text-[9px] font-mono text-rose-500 dark:text-rose-450 font-semibold">Deadline passed: {new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* B. TASKS MANAGEMENT TAB RENDER */}
          {activeTab === 'tasks' && (
            <TaskBoard 
              tasks={tasks}
              employees={employees}
              currentUser={currentUser}
              onUpdateTask={handleTaskUpdate}
              onDeleteTask={handleTaskDelete}
              onOpenCreateTaskDialog={() => setShowCreateTask(true)}
              focusedTaskId={focusedTaskId}
              onClearFocusedTask={() => setFocusedTaskId(null)}
              teams={teams}
              notifications={notifications}
            />
          )}

          {/* C. PERSONNEL DIRECTORY TAB RENDER */}
          {activeTab === 'personnel' && (
            <EmployeeManager 
              currentUser={currentUser}
              employees={employees}
              performanceScores={performanceScores}
              onAddEmployee={handleEmployeeCreation}
              onEditEmployee={handleEmployeeEdit}
              onDeleteEmployee={handleEmployeeDelete}
              teams={teams}
              onAddTeam={handleTeamCreation}
              onUpdateTeam={handleTeamUpdate}
              onDeleteTeam={handleTeamDelete}
              tasks={tasks}
            />
          )}

          {/* D. CRM OUTBOUND LOGS TAB RENDER */}
          {activeTab === 'crm' && (
            <CRMTracker 
              clients={clients}
              communicationLogs={communicationLogs}
              onAddClient={handleClientAdd}
              onAddLog={handleClientLogAdd}
            />
          )}

        </div>
      </main>

      {/* --- RENDER OVERLAYS (TASK DISPATCH MODAL) --- */}
      {showCreateTask && (
        <TaskCreationDialog 
          onClose={() => setShowCreateTask(false)}
          employees={employees}
          currentUser={currentUser!}
          onCreate={handleTaskCreation}
        />
      )}

      {/* SECURITY PASSWORD RE-KEY MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col text-left overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">Security Settings</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Rekey your secure password for {currentUser?.email}</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              {passwordError && (
                <div className="bg-rose-50 dark:bg-rose-955/20 border-l-4 border-rose-500 text-rose-800 dark:text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-955/20 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Current Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/50 outline-hidden font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
