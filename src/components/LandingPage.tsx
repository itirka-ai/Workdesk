import React, { useState } from 'react';
import { 
  Plus, Sparkles, AlertTriangle, CheckCircle, ChevronRight, 
  ArrowRight, Check, Shield, Zap, Lock, RefreshCw, Layers, 
  Calendar, Inbox, MessageSquare, Briefcase, ChevronDown, HelpCircle,
  FileText, Play, List, Database, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';

interface LandingPageProps {
  onDemoLogin: (role: 'ADMIN' | 'LEADER' | 'EMPLOYEE') => void;
  onLoginSubmit: (e: React.FormEvent) => void;
  onRegisterSubmit: (e: React.FormEvent) => void;
  authError: string;
  authSuccessMsg: string;
  isSubmittingAuth: boolean;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  regCompany: string;
  setRegCompany: (val: string) => void;
  regDomain: string;
  setRegDomain: (val: string) => void;
  regAdminName: string;
  setRegAdminName: (val: string) => void;
  regAdminEmail: string;
  setRegAdminEmail: (val: string) => void;
  regAdminPassword: string;
  setRegAdminPassword: (val: string) => void;
}

// Interactive mockup tasks representation
interface MockupTask {
  id: string;
  title: string;
  assigned: string;
  status: 'todo' | 'progress' | 'review' | 'done';
  priority: 'High' | 'Medium' | 'Low';
  comments: number;
}

export default function LandingPage({
  onDemoLogin,
  onLoginSubmit,
  onRegisterSubmit,
  authError,
  authSuccessMsg,
  isSubmittingAuth,
  isRegistering,
  setIsRegistering,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  regCompany,
  setRegCompany,
  regDomain,
  setRegDomain,
  regAdminName,
  setRegAdminName,
  regAdminEmail,
  setRegAdminEmail,
  regAdminPassword,
  setRegAdminPassword
}: LandingPageProps) {
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive Ramp HQ Mockup Kanban Tasks state
  const [mockTasks, setMockTasks] = useState<MockupTask[]>([
    { id: '1', title: 'Implement Auth Token verification API', assigned: 'Elena R.', status: 'done', priority: 'High', comments: 4 },
    { id: '2', title: 'Review multi-tenancy data leak test cases', assigned: 'Devon M.', status: 'review', priority: 'High', comments: 7 },
    { id: '3', title: 'Integrate SVG curves with Brand Navy banner', assigned: 'Liam K.', status: 'progress', priority: 'Medium', comments: 2 },
    { id: '4', title: 'Perform load check on database transaction indexing', assigned: 'Sarah H.', status: 'todo', priority: 'Low', comments: 0 }
  ]);

  const handleMockTaskMove = (taskId: string) => {
    setMockTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let nextStatus: 'todo' | 'progress' | 'review' | 'done' = 'todo';
        if (t.status === 'todo') nextStatus = 'progress';
        else if (t.status === 'progress') nextStatus = 'review';
        else if (t.status === 'review') nextStatus = 'done';
        else if (t.status === 'done') nextStatus = 'todo';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Toggle overlay triggers
  const openAuthGateway = (isSignup = false) => {
    setIsRegistering(isSignup);
    setShowAuthOverlay(true);
  };

  return (
    <div className="bg-[#FAF9F5] text-[#1A1A1A] font-sans antialiased min-h-screen relative overflow-x-hidden">
      
      {/* 1. PROMO STRIP ABOVE NAV */}
      <div className="bg-[#F1F1EF] text-[#2F2F2F] text-xs font-semibold py-2 px-4 text-center border-b border-[#E3E3E2] truncate">
        <span>🚀 WorkDesk Beta v1.4: Multi-tenant performance isolation and CRM audit logs verified! </span>
        <button 
          onClick={() => setShowDemoSelector(true)} 
          className="text-[#9035ff] hover:underline hover:text-[#7928dd] font-bold ml-2 transition"
        >
          Explore Demo Now &rarr;
        </button>
      </div>

      {/* 2. TOP STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E3E3E2]/60 h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-8">
          {/* Logo Glyph Inspired by Notion */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 bg-black text-[#FAF9F5] rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
              W
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-[#1A1A1A]">WorkDesk</span>
          </div>


        </div>

        {/* Right Nav Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => openAuthGateway(false)} 
            className="text-sm font-medium text-[#4D4D4C] hover:text-[#1A1A1A] px-3 py-1.5 rounded transition"
          >
            Log in
          </button>
          <button 
            onClick={() => openAuthGateway(true)} 
            className="bg-[#9035ff] text-white text-sm font-semibold px-5 py-2 rounded-md hover:bg-[#7928dd] active:scale-[0.98] transition duration-150 shadow-sm"
          >
            Get WorkDesk free
          </button>
        </div>
      </header>

      {/* 3. HERO BAND SECTION (Deep Navy) */}
      <section className="bg-[#0b0e29] text-white pt-20 pb-36 px-6 relative overflow-hidden text-center">
        {/* Scattered sticky note dots decorative graphics */}
        <div className="absolute top-12 left-8 md:left-24 w-5 h-5 bg-[#ffeae6] rounded-full opacity-60 animate-bounce" />
        <div className="absolute top-36 right-8 md:right-32 w-4 h-4 bg-[#eaf7ff] rounded-full opacity-50" />
        <div className="absolute bottom-24 left-16 w-3 h-3 bg-[#fde047] rounded-full opacity-70" />
        
        {/* Atmospheric Mesh Lines SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mesh-wire" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mesh-wire)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <p className="text-[#9035ff] text-xs font-bold uppercase tracking-widest bg-purple-950/40 border border-[#9035ff]/30 w-fit mx-auto px-3 py-1.5 rounded-full">
            ✦ All-In-One Enterprise System
          </p>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-white max-w-3xl mx-auto">
            Meet the night shift.
          </h1>

          <p className="text-lg md:text-xl text-[#BCBCC3] max-w-2xl mx-auto font-light leading-relaxed">
            The on-demand, beautifully collaborative workforce suite. Keep task pipelines moving, measure precise performance indexes, and segregate client communications—built with strict cryptographic isolation constraints.
          </p>

          {/* Button Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => openAuthGateway(true)} 
              className="w-full sm:w-auto bg-[#9035ff] hover:bg-[#7928dd] text-white font-semibold px-8 py-3.5 rounded-md text-base transition duration-150 active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              Get WorkDesk free <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowDemoSelector(true)} 
              className="w-full sm:w-auto bg-transparent border border-white/30 text-white font-semibold px-8 py-3.5 rounded-md text-base hover:bg-white/5 transition"
            >
              Request a demo
            </button>
          </div>
        </div>

        {/* 4. MOCKUP WORKSPACE CARD BREAKING OUT (Ramp HQ) */}
        <div className="max-w-6xl mx-auto px-4 mt-20 relative z-20">
          <div className="bg-white rounded-xl border border-[#DEDEE2] shadow-[0_24px_48px_-8px_rgba(15,15,15,0.20)] overflow-hidden text-[#1A1A1A] text-left">
            {/* Mockup Header bar */}
            <div className="bg-[#FAF9F6] border-b border-[#E6E6EA] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="text-xs text-[#808088] font-mono ml-4 truncate">demo-workspace / Ramp HQ Kanban Board</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#F3EFFF] text-[#6B21A8] font-semibold px-2.5 py-1 rounded">Ramp Enterprise Tenant</span>
                <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Synchronized
                </span>
              </div>
            </div>

            {/* Mockup Sub Bar */}
            <div className="border-b border-[#E6E6EA] px-6 py-3 bg-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#1A1A1A]">📌 Ramp HQ Board</span>
                <span className="text-xs text-[#808088]">4 Columns Active</span>
              </div>
              <p className="text-xs text-[#808088] italic">Click any card to shift statuses in real time!</p>
            </div>

            {/* Kanban Columns Grid */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#FCFCFB]">
              {/* Column 1: Planned (TODO) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#808088] uppercase tracking-wider pb-1">
                  <span>📋 Planned</span>
                  <span className="bg-[#EAEAEA] px-1.5 py-0.5 rounded text-[#222]">
                    {mockTasks.filter(t => t.status === 'todo').length}
                  </span>
                </div>
                <div className="space-y-2">
                  {mockTasks.filter(t => t.status === 'todo').map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleMockTaskMove(task.id)}
                      className="bg-white p-4 rounded-lg border border-[#DEDEE2] shadow-sm hover:border-[#9035ff] hover:shadow transition duration-150 cursor-pointer space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{task.title}</h4>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="bg-slate-100 text-[#4E4E4E] px-2 py-0.5 rounded">👤 {task.assigned}</span>
                        <span className="text-[#808088] flex items-center gap-1">💬 {task.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#2563EB] uppercase tracking-wider pb-1">
                  <span>⚡ In Progress</span>
                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    {mockTasks.filter(t => t.status === 'progress').length}
                  </span>
                </div>
                <div className="space-y-2">
                  {mockTasks.filter(t => t.status === 'progress').map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleMockTaskMove(task.id)}
                      className="bg-white p-4 rounded-lg border border-[#DEDEE2] shadow-sm hover:border-[#9035ff] hover:shadow transition duration-150 cursor-pointer space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{task.title}</h4>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">👤 {task.assigned}</span>
                        <span className="text-[#808088] flex items-center gap-1">💬 {task.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: In Review */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#D97706] uppercase tracking-wider pb-1">
                  <span>🔬 In Review</span>
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    {mockTasks.filter(t => t.status === 'review').length}
                  </span>
                </div>
                <div className="space-y-2">
                  {mockTasks.filter(t => t.status === 'review').map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleMockTaskMove(task.id)}
                      className="bg-white p-4 rounded-lg border border-[#DEDEE2] shadow-sm hover:border-[#9035ff] hover:shadow transition duration-150 cursor-pointer space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2">{task.title}</h4>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">👤 {task.assigned}</span>
                        <span className="text-[#808088] flex items-center gap-1">💬 {task.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Completed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#16A34A] uppercase tracking-wider pb-1">
                  <span>✅ Completed</span>
                  <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    {mockTasks.filter(t => t.status === 'done').length}
                  </span>
                </div>
                <div className="space-y-2">
                  {mockTasks.filter(t => t.status === 'done').map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleMockTaskMove(task.id)}
                      className="bg-white p-4 rounded-lg border border-[#DEDEE2] shadow-sm hover:border-[#9035ff] hover:shadow transition duration-150 cursor-pointer space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 line-through text-[#808088]">{task.title}</h4>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">👤 {task.assigned}</span>
                        <span className="text-[#808088] flex items-center gap-1">💬 {task.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>



      {/* 6. FEATURE MATRIX SECTION (Keep Work Running Smoothly) */}
      <section id="product" className="py-24 px-6 max-w-6xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">🚀 Keep Work Running Smoothly</h2>
          <p className="text-base text-[#4D4D4C]">Manage work anytime with live updates, status tracking, alerts, and performance dashboards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tile 1: Strong Data Security */}
          <div className="bg-white p-6 rounded-lg border border-[#DEDEE2] shadow-sm space-y-4">
            <div className="w-10 h-10 bg-[#ffeae6] rounded-full flex items-center justify-center text-lg">
              🔒
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Strong Data Security</h3>
            <p className="text-sm text-[#4D4D4C]">Keep company data separate and secure so information never mixes between teams or organizations.</p>
          </div>
          {/* Tile 2: Smart Analytics */}
          <div className="bg-white p-6 rounded-lg border border-[#DEDEE2] shadow-sm space-y-4">
            <div className="w-10 h-10 bg-[#eaf7ff] rounded-full flex items-center justify-center text-lg">
              📈
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Smart Analytics</h3>
            <p className="text-sm text-[#4D4D4C]">View easy-to-understand reports and graphs for productivity, response time, and project progress.</p>
          </div>
          {/* Tile 3: Instant Notifications */}
          <div className="bg-white p-6 rounded-lg border border-[#DEDEE2] shadow-sm space-y-4">
            <div className="w-10 h-10 bg-[#eef9f2] rounded-full flex items-center justify-center text-lg">
              🔔
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Instant Notifications</h3>
            <p className="text-sm text-[#4D4D4C]">Get real-time emails and alerts when important updates or milestones happen.</p>
          </div>
          {/* Tile 4: Team & Department Management */}
          <div className="bg-white p-6 rounded-lg border border-[#DEDEE2] shadow-sm space-y-4">
            <div className="w-10 h-10 bg-[#f3efff] rounded-full flex items-center justify-center text-lg">
              🏢
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Team & Department Management</h3>
            <p className="text-sm text-[#4D4D4C]">Create departments, organize teams, and assign leaders for better coordination and reporting.</p>
          </div>
        </div>
      </section>







      {/* 11. FAQ ACCORDION SECTION */}
      <section className="py-24 px-6 max-w-4xl mx-auto space-y-12">
        <h2 className="text-2xl md:text-4xl text-center font-bold tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "What is WorkDesk, and how does data security work?",
              a: "WorkDesk is a business project tracking and CRM platform that keeps each company’s data separate and secure. Your company information stays private and cannot be accessed by other organizations."
            },
            {
              q: "Can I test different roles and permissions?",
              a: "Yes. You can explore different user roles and permissions inside the workspace to manage access and team responsibilities easily."
            },
            {
              q: "Are KPI metrics updated in real time?",
              a: "Yes. Performance metrics and activity data update automatically as changes happen, helping teams stay informed."
            },
            {
              q: "What is the suspension mechanism?",
              a: "The suspension mechanism helps manage inactive or restricted accounts while keeping important company data secure and organized."
            }
          ].map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white border border-[#DEDEE2] rounded-lg overflow-hidden text-left"
            >
              <button 
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-4 font-semibold flex items-center justify-between text-[#1a1a1a]"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition duration-250 ${activeFaq === idx ? 'transform rotate-180 text-[#9035ff]' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-[#F1F1EF]"
                  >
                    <p className="px-6 py-4 text-sm text-[#4D4D4C] bg-[#FCFCFB] leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 12. BOTTOM SIGNUP CTA CALL */}
      <section className="py-24 bg-[#0b0e29] text-white text-center px-6 relative overflow-hidden border-t border-[#E3E3E2]/30">
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Build Your Workspace Today</h2>
          <div className="space-y-3 text-base text-[#BCBCC3] max-w-lg mx-auto leading-relaxed">
            <p>Bring your teams, tasks, communication, and business records into one organized platform.</p>
            <p>Start using WorkDesk for free and manage everything in one place.</p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => openAuthGateway(true)}
              className="px-8 py-3.5 bg-[#9035ff] hover:bg-[#7928dd] text-white font-bold rounded-md text-base transition duration-150 inline-flex items-center gap-2 active:scale-95 shadow-lg"
            >
              Get Started with WorkDesk &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 13. SIX NAVIGATION FOOTER REGION */}
      <footer className="bg-white border-t border-[#DEDEE2] py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-8 text-left text-xs mb-12">
          {/* Column 1 - Brand Info */}
          <div className="space-y-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center font-bold text-sm">W</div>
              <span className="font-bold text-sm tracking-tight text-[#111]">WorkDesk</span>
            </div>
            <p className="text-[#808088] leading-relaxed">
              Secure B2B workspace for project tracking, CRM activity, team operations, and KPI monitoring — built with strong tenant-level data protection.
            </p>
            <p className="text-[10px] text-[#808088]">
              © 2026 WorkDesk. All rights reserved.
            </p>
          </div>

          {/* Column 2 - Product */}
          <div className="space-y-3">
            <h5 className="font-bold text-[#111] uppercase tracking-wider text-[10px]">Product</h5>
            <ul className="space-y-2 text-[#4D4D4C]">
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">AI Command Center</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">Kanban Boards</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">KPI Analytics</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">CRM Activity Logs</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">Team Management</button></li>
            </ul>
          </div>

          {/* Column 3 - Platform */}
          <div className="space-y-3">
            <h5 className="font-bold text-[#111] uppercase tracking-wider text-[10px]">Platform</h5>
            <ul className="space-y-2 text-[#4D4D4C]">
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">Workspace Access</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">Role Permissions</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">Department Management</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">Notifications & Alerts</button></li>
              <li><button onClick={() => openAuthGateway(false)} className="hover:text-black bg-transparent border-none p-0 cursor-pointer text-left text-xs text-[#4D4D4C] block">API Integrations</button></li>
            </ul>
          </div>

          {/* Column 4 - Resources */}
          <div className="space-y-3">
            <h5 className="font-bold text-[#111] uppercase tracking-wider text-[10px]">Resources</h5>
            <ul className="space-y-2 text-[#4D4D4C]">
              <li><a href="#docs" className="hover:text-black text-[#4D4D4C] no-underline">Documentation</a></li>
              <li><a href="#help" className="hover:text-black text-[#4D4D4C] no-underline">Help Center</a></li>
              <li><a href="#security" className="hover:text-black text-[#4D4D4C] no-underline">Security Policy</a></li>
              <li><a href="#status" className="hover:text-black text-[#4D4D4C] no-underline">System Status</a></li>
              <li><a href="#support" className="hover:text-black text-[#4D4D4C] no-underline">Contact Support</a></li>
            </ul>
          </div>

          {/* Column 5 - Legal */}
          <div className="space-y-3">
            <h5 className="font-bold text-[#111] uppercase tracking-wider text-[10px]">Legal</h5>
            <ul className="space-y-2 text-[#4D4D4C]">
              <li><a href="#privacy" className="hover:text-black text-[#4D4D4C] no-underline">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-black text-[#4D4D4C] no-underline">Terms of Service</a></li>
              <li><a href="#gdpr" className="hover:text-black text-[#4D4D4C] no-underline">GDPR Compliance</a></li>
              <li><a href="#security" className="hover:text-black text-[#4D4D4C] no-underline">Data Security</a></li>
            </ul>
          </div>
        </div>

        {/* Start managing work smarter with WorkDesk footer CTA line */}
        <div className="border-t border-[#F1F1EF] pt-8 flex items-center justify-between text-xs">
          <button 
            type="button"
            onClick={() => openAuthGateway(true)}
            className="text-[#9035ff] hover:text-[#7928dd] font-bold inline-flex items-center gap-1.5 transition bg-transparent border-none p-0 cursor-pointer"
          >
            Start managing work smarter with WorkDesk &rarr;
          </button>
        </div>
      </footer>

      {/* 14. FLOATING AUTHENTICATION GATEWAY DIALOG OVERLAY */}
      <AnimatePresence>
        {showAuthOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-[440px] bg-white p-8 md:p-10 rounded-2xl border border-[#DEDEE2] shadow-2xl space-y-6 relative"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowAuthOverlay(false)}
                className="absolute right-5 top-5 p-1.5 text-[#808088] hover:text-[#111] hover:bg-[#F3F3F2] rounded-full transition"
              >
                <Plus className="w-5 h-5 transform rotate-45" />
              </button>

              {/* Brand Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
                  W
                </div>
                <div>
                  <h3 className="font-sans font-bold text-2xl tracking-tight text-[#1a1a1a]">WorkDesk Workspace</h3>
                  <p className="text-xs text-[#808088] leading-relaxed">Secure Multi-tenant Operation & Performance Workspace</p>
                </div>
              </div>

              {/* System Alerts */}
              {authError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg text-xs text-rose-800 flex items-center gap-2 text-left">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg text-xs text-emerald-800 flex items-center gap-2 text-left">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {/* Login UI & Registration Forms */}
              {!isRegistering ? (
                /* Login Form */
                <form onSubmit={(e) => {
                  onLoginSubmit(e);
                }} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#808088] mb-1.5">Corporate Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. admin@aether.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF9F6] text-[#1a1a1a] border border-[#DEDEE2] rounded-lg text-xs focus:ring-1 focus:ring-[#9035ff] focus:border-[#9035ff] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#808088] mb-1.5">Secure Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="e.g. admin123"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF9F6] text-[#1a1a1a] border border-[#DEDEE2] rounded-lg text-xs focus:ring-1 focus:ring-[#9035ff] focus:border-[#9035ff] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full bg-[#9035ff] hover:bg-[#7928dd] text-white rounded-lg text-xs font-bold py-3.5 transition shadow-md disabled:opacity-50 cursor-pointer text-center block mt-2"
                  >
                    {isSubmittingAuth ? 'Verifying credentials...' : 'Enter Workspace Console'}
                  </button>
                </form>
              ) : (
                /* Expansion Sign-up Enterprise form */
                <form onSubmit={(e) => {
                  onRegisterSubmit(e);
                }} className="space-y-3.5 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#808088] mb-1">Company Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Zenith Tech"
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF9F6] text-[#111] border border-[#DEDEE2] rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-[#808088] mb-1">Domain Mapping</label>
                      <input 
                        type="text" 
                        required
                        placeholder="zenith.com"
                        value={regDomain}
                        onChange={(e) => setRegDomain(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF9F6] text-[#111] border border-[#DEDEE2] rounded text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#808088] mb-1.5">Corporate Admin Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Elena Rostova"
                      value={regAdminName}
                      onChange={(e) => setRegAdminName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#FAF9F6] text-[#111] border border-[#DEDEE2] rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#808088] mb-1.5">Corporate Admin Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="admin@zenith.com"
                      value={regAdminEmail}
                      onChange={(e) => setRegAdminEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#FAF9F6] text-[#111] border border-[#DEDEE2] rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-[#808088] mb-1.5">Master Token Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Minimum 6 characters"
                      value={regAdminPassword}
                      onChange={(e) => setRegAdminPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#FAF9F6] text-[#111] border border-[#DEDEE2] rounded text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full bg-[#9035ff] hover:bg-[#7928dd] text-white rounded text-xs font-bold py-3 transition shadow-md disabled:opacity-50 cursor-pointer text-center block"
                  >
                    {isSubmittingAuth ? 'Provisioning Partition...' : 'Create Enterprise Partition'}
                  </button>
                </form>
              )}

              {/* Toggle Switch */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                  }}
                  className="text-xs text-[#9035ff] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  {!isRegistering 
                    ? 'Deploy a new B2B company workspace demo instead →' 
                    : '← Sign in with existing credentials'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 15. DEDICATED DEMO INSTANT ACCESS OVERLAY */}
      <AnimatePresence>
        {showDemoSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-white p-8 md:p-10 rounded-2xl border border-[#DEDEE2] shadow-2xl space-y-6 relative"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowDemoSelector(false)}
                className="absolute right-5 top-5 p-1.5 text-[#808088] hover:text-[#111] hover:bg-[#F3F3F2] rounded-full transition"
              >
                <Plus className="w-5 h-5 transform rotate-45" />
              </button>

              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-sm">
                  W
                </div>
                <div>
                  <h3 className="font-sans font-bold text-2xl tracking-tight text-[#1a1a1a]">Explore WorkDesk Live Demo</h3>
                  <p className="text-xs text-[#808088] max-w-sm mx-auto leading-relaxed">
                    Select a secure B2B tenant persona to launch the system instantly. No credential retrieval required.
                  </p>
                </div>
              </div>

              {/* Demo Roles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Admin Role */}
                <button
                  type="button"
                  onClick={() => {
                    onDemoLogin('ADMIN');
                    setShowDemoSelector(false);
                  }}
                  className="group relative flex flex-col justify-between text-left p-5 bg-[#FAF9F6] border border-[#E3E3E2] hover:border-[#9035ff] hover:bg-purple-50/30 rounded-xl transition cursor-pointer active:scale-[0.98] h-full"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-purple-100 text-[#9035ff] rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                      👑
                    </div>
                    <h4 className="font-bold text-sm text-[#1A1A1A] group-hover:text-[#9035ff] transition-colors leading-tight">Corporate Admin</h4>
                    <p className="text-[11px] text-[#4D4D4C] leading-normal font-light">
                      Elena Rostova
                    </p>
                    <p className="text-[10px] text-[#808088] leading-tight pt-1">
                      Full system analytics, invite team leads, manage clients & departments.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-[#9035ff] pt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Access Dashboard &rarr;
                  </div>
                </button>

                {/* Leader Role */}
                <button
                  type="button"
                  onClick={() => {
                    onDemoLogin('LEADER');
                    setShowDemoSelector(false);
                  }}
                  className="group relative flex flex-col justify-between text-left p-5 bg-[#FAF9F6] border border-[#E3E3E2] hover:border-[#9035ff] hover:bg-purple-50/30 rounded-xl transition cursor-pointer active:scale-[0.98] h-full"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                      💼
                    </div>
                    <h4 className="font-bold text-sm text-[#1A1A1A] group-hover:text-[#9035ff] transition-colors leading-tight">Department Lead</h4>
                    <p className="text-[11px] text-[#4D4D4C] leading-normal font-light">
                      Devon Miller
                    </p>
                    <p className="text-[10px] text-[#808088] leading-tight pt-1">
                      Manage department task queues, review deliverables, log client CRM notes.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-[#9035ff] pt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Access Dashboard &rarr;
                  </div>
                </button>

                {/* Employee Role */}
                <button
                  type="button"
                  onClick={() => {
                    onDemoLogin('EMPLOYEE');
                    setShowDemoSelector(false);
                  }}
                  className="group relative flex flex-col justify-between text-left p-5 bg-[#FAF9F6] border border-[#E3E3E2] hover:border-[#9035ff] hover:bg-purple-50/30 rounded-xl transition cursor-pointer active:scale-[0.98] h-full"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
                      🛠️
                    </div>
                    <h4 className="font-bold text-sm text-[#1A1A1A] group-hover:text-[#9035ff] transition-colors leading-tight">Team Employee</h4>
                    <p className="text-[11px] text-[#4D4D4C] leading-normal font-light">
                      Elena / emp1
                    </p>
                    <p className="text-[10px] text-[#808088] leading-tight pt-1">
                      Check off daily tasks, view timesheets, access files securely.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-[#9035ff] pt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Access Dashboard &rarr;
                  </div>
                </button>
              </div>

              <div className="text-center pt-2 border-t border-[#F1F1EF]">
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoSelector(false);
                    openAuthGateway(false);
                  }}
                  className="text-xs text-[#808088] hover:text-[#1A1A1A] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Or enter custom enterprise credentials &rarr;
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
