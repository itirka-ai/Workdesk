/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import {
  User,
  Company,
  Team,
  Task,
  PerformanceScore,
  Client,
  CommunicationLog,
  Notification,
  UserRole,
  TaskStatus,
  TaskPriority
} from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  companies: Company[];
  users: User[];
  teams: Team[];
  tasks: Task[];
  performanceScores: PerformanceScore[];
  clients: Client[];
  communicationLogs: CommunicationLog[];
  notifications: Notification[];
}

// Global in-memory cache to make reads lightning-fast
let dbCache: Schema | null = null;

// Supabase Connection parameters for Enterprise scalability
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_KEY);

const supabase = isSupabaseEnabled ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Tracking variable to handle seed injection locking
let isSeedingCompleted = false;

// Helper to ensure database structure exists
function ensureDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const freshData = generateInitialSeeds();
    fs.writeFileSync(DB_FILE, JSON.stringify(freshData, null, 2), 'utf8');
    dbCache = freshData;
  } else if (!dbCache) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(content);
    } catch (e) {
      console.error("Error reading database file, re-creating...", e);
      const freshData = generateInitialSeeds();
      fs.writeFileSync(DB_FILE, JSON.stringify(freshData, null, 2), 'utf8');
      dbCache = freshData;
    }
  }
}

// Transactional write to file
function saveDb() {
  if (!dbCache) return;
  fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
}

function generateInitialSeeds(): Schema {
  console.log("Generating fresh seed data with pre-hashed passwords...");

  // Generate standard password hashes
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const leaderHash = bcrypt.hashSync('leader123', salt);
  const empHash = bcrypt.hashSync('emp123', salt);

  const companies: Company[] = [
    {
      id: 'co_aether',
      name: 'Aether Dynamics',
      domain: 'aether.com',
      createdAt: new Date('2026-01-10T08:00:00Z').toISOString()
    },
    {
      id: 'co_zenith',
      name: 'Zenith Solutions',
      domain: 'zenith.com',
      createdAt: new Date('2026-02-15T09:30:00Z').toISOString()
    }
  ];

  const users: User[] = [
    // Company 1: Aether Dynamics
    {
      id: 'usr_ae_admin',
      name: 'Elena Rostova',
      email: 'admin@aether.com',
      role: UserRole.ADMIN,
      department: 'Operations',
      companyId: 'co_aether',
      phone: '+1 (555) 0192',
      createdAt: new Date('2026-01-11T10:00:00Z').toISOString(),
      passwordHash: adminHash
    },
    {
      id: 'usr_ae_leader',
      name: 'Marcus Vance',
      email: 'leader@aether.com',
      role: UserRole.TEAM_LEADER,
      department: 'Engineering',
      companyId: 'co_aether',
      phone: '+1 (555) 0183',
      createdAt: new Date('2026-01-12T09:15:00Z').toISOString(),
      passwordHash: leaderHash
    },
    {
      id: 'usr_ae_emp1',
      name: 'Sarah Chen',
      email: 'emp1@aether.com',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      companyId: 'co_aether',
      phone: '+1 (555) 0144',
      createdAt: new Date('2026-01-15T11:00:00Z').toISOString(),
      passwordHash: empHash
    },
    {
      id: 'usr_ae_emp2',
      name: 'Devon Miller',
      email: 'emp2@aether.com',
      role: UserRole.EMPLOYEE,
      department: 'Marketing & Sales',
      companyId: 'co_aether',
      phone: '+1 (555) 0210',
      createdAt: new Date('2026-01-18T10:30:00Z').toISOString(),
      passwordHash: empHash
    },

    // Company 2: Zenith Solutions
    {
      id: 'usr_ze_admin',
      name: 'Liam Sterling',
      email: 'admin@zenith.com',
      role: UserRole.ADMIN,
      department: 'Executive Office',
      companyId: 'co_zenith',
      phone: '+44 20 7946 0958',
      createdAt: new Date('2026-02-16T10:00:00Z').toISOString(),
      passwordHash: adminHash
    },
    {
      id: 'usr_ze_leader',
      name: 'Sophia Dubois',
      email: 'leader@zenith.com',
      role: UserRole.TEAM_LEADER,
      department: 'Product Strategy',
      companyId: 'co_zenith',
      phone: '+44 20 7946 0113',
      createdAt: new Date('2026-02-18T09:00:00Z').toISOString(),
      passwordHash: leaderHash
    },
    {
      id: 'usr_ze_emp1',
      name: 'Nikhil Rao',
      email: 'emp1@zenith.com',
      role: UserRole.EMPLOYEE,
      department: 'Product Strategy',
      companyId: 'co_zenith',
      phone: '+44 20 7946 0233',
      createdAt: new Date('2026-02-20T11:45:00Z').toISOString(),
      passwordHash: empHash
    }
  ];

  const teams: Team[] = [
    {
      id: 'team_ae_eng',
      name: 'Core Platform Engineering',
      companyId: 'co_aether',
      leaderId: 'usr_ae_leader',
      department: 'Engineering',
      employeeIds: ['usr_ae_emp1'],
      createdAt: new Date('2026-01-15T14:00:00Z').toISOString()
    },
    {
      id: 'team_ze_prod',
      name: 'SaaS Excellence Unit',
      companyId: 'co_zenith',
      leaderId: 'usr_ze_leader',
      department: 'Product Strategy',
      employeeIds: ['usr_ze_emp1'],
      createdAt: new Date('2026-02-22T08:30:00Z').toISOString()
    }
  ];

  const tasks: Task[] = [
    // Aether Tasks
    {
      id: 'tsk_ae_1',
      companyId: 'co_aether',
      title: 'Optimize Core DB Query Plannings',
      description: 'The response time of the task analytical dashboard degrades when records exceed 10,000. Rewrite heavy raw joins and set indices over foreign reference keys. Record performance results inside comments with metrics logs.',
      assignedTo: 'usr_ae_emp1',
      createdBy: 'usr_ae_leader',
      deadline: new Date('2026-06-15T17:00:00Z').toISOString(),
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.IN_PROGRESS,
      progress: 60,
      recurringType: 'NONE',
      isFutureScheduled: false,
      attachments: [
        {
          name: 'query-planning-explain.txt',
          url: '#',
          uploadedBy: 'Elena Rostova',
          uploadedAt: new Date('2026-05-18T14:32:00Z').toISOString(),
          size: '15 KB'
        }
      ],
      comments: [
        {
          id: 'cmt_ae_1',
          taskId: 'tsk_ae_1',
          commenterId: 'usr_ae_leader',
          commenterName: 'Marcus Vance',
          commenterRole: UserRole.TEAM_LEADER,
          content: 'Awesome. Added indexing strategies. Make sure to profile matching queries properly Sarah.',
          createdAt: new Date('2026-05-19T09:30:00Z').toISOString()
        },
        {
          id: 'cmt_ae_2',
          taskId: 'tsk_ae_1',
          commenterId: 'usr_ae_emp1',
          commenterName: 'Sarah Chen',
          commenterRole: UserRole.EMPLOYEE,
          content: 'Completed stage 1 profiling. Query latency dropped from 850ms to 42ms for standard tenants.',
          createdAt: new Date('2026-05-20T15:20:00Z').toISOString()
        }
      ],
      activityLogs: [
        {
          id: 'act_ae1_1',
          userId: 'usr_ae_leader',
          userName: 'Marcus Vance',
          action: 'Created task and assigned to Sarah Chen',
          timestamp: new Date('2026-05-18T09:00:00Z').toISOString()
        },
        {
          id: 'act_ae1_2',
          userId: 'usr_ae_emp1',
          userName: 'Sarah Chen',
          action: 'Updated status to IN_PROGRESS and bumped progress to 60%',
          timestamp: new Date('2026-05-20T15:21:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-05-18T09:00:00Z').toISOString()
    },
    {
      id: 'tsk_ae_2',
      companyId: 'co_aether',
      title: 'Revamp SaaS Marketing Funnel Collateral',
      description: 'Reorganize our corporate decks and draft engaging B2B outbound campaign copy. This needs tight alignment with our brand guidelines to boost enterprise lead acquisitions.',
      assignedTo: 'usr_ae_emp2',
      createdBy: 'usr_ae_admin',
      deadline: new Date('2026-06-01T18:00:00Z').toISOString(),
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      progress: 0,
      recurringType: 'NONE',
      isFutureScheduled: false,
      attachments: [],
      comments: [],
      activityLogs: [
        {
          id: 'act_ae2_1',
          userId: 'usr_ae_admin',
          userName: 'Elena Rostova',
          action: 'Created task and assigned to Devon Miller',
          timestamp: new Date('2026-05-20T10:00:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-05-20T10:00:00Z').toISOString()
    },
    {
      id: 'tsk_ae_3',
      companyId: 'co_aether',
      title: 'Complete Soc2 Compliance Attestation Audit',
      description: 'Collect configuration evidence for key encryption routines, multi-factor enablement audit trails, and data isolation mechanisms across standard server routines.',
      assignedTo: 'usr_ae_leader',
      createdBy: 'usr_ae_admin',
      deadline: new Date('2026-05-28T17:00:00Z').toISOString(),
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.REVIEW,
      progress: 95,
      recurringType: 'NONE',
      isFutureScheduled: false,
      attachments: [
        {
          name: 'soc2-readiness-evidence-v1.zip',
          url: '#',
          uploadedBy: 'Marcus Vance',
          uploadedAt: new Date('2026-05-21T08:00:00Z').toISOString(),
          size: '2.4 MB'
        }
      ],
      comments: [
        {
          id: 'cmt_ae_3',
          taskId: 'tsk_ae_3',
          commenterId: 'usr_ae_leader',
          commenterName: 'Marcus Vance',
          commenterRole: UserRole.TEAM_LEADER,
          content: 'All SOC2 security requirements are documented and zipped. Ready for your executive sign-off Elena.',
          createdAt: new Date('2026-05-21T08:05:00Z').toISOString()
        }
      ],
      activityLogs: [
        {
          id: 'act_ae3_1',
          userId: 'usr_ae_admin',
          userName: 'Elena Rostova',
          action: 'Assigned audit assignment to Marcus',
          timestamp: new Date('2026-05-15T10:00:00Z').toISOString()
        },
        {
          id: 'act_ae3_2',
          userId: 'usr_ae_leader',
          userName: 'Marcus Vance',
          action: 'Set status to REVIEW and added SOC2 evidence archive attachment',
          timestamp: new Date('2026-05-21T08:05:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-05-15T10:00:00Z').toISOString()
    },
    {
      id: 'tsk_ae_4',
      companyId: 'co_aether',
      title: 'Weekly Multi-Tenant DB Integrity Verification',
      description: 'Automated recurring health check to scan partition scopes, indices sizes, and verify there is no data schema drift or multi-tenant ID cross leakage.',
      assignedTo: 'usr_ae_leader',
      createdBy: 'usr_ae_admin',
      deadline: new Date('2026-05-23T12:00:00Z').toISOString(),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      progress: 100,
      recurringType: 'WEEKLY',
      isFutureScheduled: false,
      attachments: [],
      comments: [],
      activityLogs: [
        {
          id: 'act_ae4_1',
          userId: 'usr_ae_admin',
          userName: 'Elena Rostova',
          action: 'Configured recurring job. Run verified successfully.',
          timestamp: new Date('2026-05-16T12:00:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-05-16T12:00:00Z').toISOString()
    },
    {
      id: 'tsk_ae_5',
      companyId: 'co_aether',
      title: 'Migrate Outdated Webpack Bundles to Vite',
      description: 'Historical front-end migration containing legacy vendor files. This task represents our technical improvements goals.',
      assignedTo: 'usr_ae_emp1',
      createdBy: 'usr_ae_leader',
      deadline: new Date('2026-05-10T17:00:00Z').toISOString(), // Historical overdue date
      priority: TaskPriority.LOW,
      status: TaskStatus.OVERDUE,
      progress: 35,
      recurringType: 'NONE',
      isFutureScheduled: false,
      attachments: [],
      comments: [
        {
          id: 'cmt_ae_5',
          taskId: 'tsk_ae_5',
          commenterId: 'usr_ae_emp1',
          commenterName: 'Sarah Chen',
          commenterRole: UserRole.EMPLOYEE,
          content: 'Ran into compatibility issues with third-party charting libraries. Will resume after DB index work handles latency.',
          createdAt: new Date('2026-05-09T14:00:00Z').toISOString()
        }
      ],
      activityLogs: [
        {
          id: 'act_ae5_1',
          userId: 'usr_ae_leader',
          userName: 'Marcus Vance',
          action: 'Created fallback migration',
          timestamp: new Date('2026-05-01T09:00:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-05-01T09:00:00Z').toISOString()
    },

    // Zenith Tasks (Clean separation)
    {
      id: 'tsk_ze_1',
      companyId: 'co_zenith',
      title: 'Client Experience Mapping Strategy',
      description: 'Conduct comprehensive journey maps for our onboarding trial group. Create client segments, logs, and schedule sync discussions.',
      assignedTo: 'usr_ze_emp1',
      createdBy: 'usr_ze_leader',
      deadline: new Date('2026-06-10T18:00:00Z').toISOString(),
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      progress: 40,
      recurringType: 'NONE',
      attachments: [],
      comments: [],
      activityLogs: [
        {
          id: 'act_ze1_1',
          userId: 'usr_ze_leader',
          userName: 'Sophia Dubois',
          action: 'Created task and assigned to Nikhil Rao',
          timestamp: new Date('2026-05-19T10:00:00Z').toISOString()
        }
      ],
      createdAt: new Date('2026-05-19T10:00:00Z').toISOString()
    }
  ];

  const performanceScores: PerformanceScore[] = [
    // Aether Scores
    {
      id: 'perf_ae_emp1',
      userId: 'usr_ae_emp1',
      companyId: 'co_aether',
      monthYear: '05/2026',
      taskCompletionRate: 94,
      deadlineAdherence: 90,
      productivityScore: 92,
      responseTime: 1.5,
      attendanceConsistency: 98,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'perf_ae_emp2',
      userId: 'usr_ae_emp2',
      companyId: 'co_aether',
      monthYear: '05/2026',
      taskCompletionRate: 82,
      deadlineAdherence: 85,
      productivityScore: 78,
      responseTime: 3.2,
      attendanceConsistency: 92,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'perf_ae_leader',
      userId: 'usr_ae_leader',
      companyId: 'co_aether',
      monthYear: '05/2026',
      taskCompletionRate: 98,
      deadlineAdherence: 100,
      productivityScore: 96,
      responseTime: 0.8,
      attendanceConsistency: 100,
      updatedAt: new Date().toISOString()
    },

    // Zenith Scores
    {
      id: 'perf_ze_emp1',
      userId: 'usr_ze_emp1',
      companyId: 'co_zenith',
      monthYear: '05/2026',
      taskCompletionRate: 88,
      deadlineAdherence: 82,
      productivityScore: 84,
      responseTime: 2.1,
      attendanceConsistency: 95,
      updatedAt: new Date().toISOString()
    }
  ];

  const clients: Client[] = [
    // Aether Clients
    {
      id: 'cli_ae_1',
      companyId: 'co_aether',
      name: 'Apex Global Enterprises',
      email: 'contact@apexglobal.com',
      phone: '+1 (555) 0846',
      industry: 'Aerospace Systems',
      notes: 'Strategic tier-1 client. Very strict on SOC2 parameters and response guarantees.',
      createdAt: new Date('2026-02-01T09:00:00Z').toISOString()
    },
    {
      id: 'cli_ae_2',
      companyId: 'co_aether',
      name: 'Vortex Analytics Corp',
      email: 'partners@vortex.io',
      phone: '+1 (555) 0911',
      industry: 'Logistics Software',
      notes: 'Bimonthly product briefings required. Extremely active on engineering dashboards integration.',
      createdAt: new Date('2026-03-05T10:30:00Z').toISOString()
    },

    // Zenith Clients
    {
      id: 'cli_ze_1',
      companyId: 'co_zenith',
      name: 'Hyperion Holdings',
      email: 'hq@hyperion.com',
      phone: '+44 20 7946 0885',
      industry: 'Investment and VC',
      notes: 'Portfolio managers seeking dashboard oversight integrations.',
      createdAt: new Date('2026-03-10T11:00:00Z').toISOString()
    }
  ];

  const communicationLogs: CommunicationLog[] = [
    // Aether Communication History
    {
      id: 'log_ae_1',
      clientId: 'cli_ae_1',
      clientName: 'Apex Global Enterprises',
      companyId: 'co_aether',
      loggedById: 'usr_ae_admin',
      loggedByName: 'Elena Rostova',
      mode: 'MEETING',
      notes: 'Discussed task planning timelines for our Soc2 compliance evidence reports. Apex verified readiness, and was highly enthusiastic about WorkDesk transparency rules.',
      createdAt: new Date('2026-05-18T16:00:00Z').toISOString()
    },
    {
      id: 'log_ae_2',
      clientId: 'cli_ae_1',
      clientName: 'Apex Global Enterprises',
      companyId: 'co_aether',
      loggedById: 'usr_ae_leader',
      loggedByName: 'Marcus Vance',
      mode: 'CALL',
      notes: 'Reviewed custom indices metrics details and system availability charts. Client asked for monthly infrastructure summaries going forward.',
      createdAt: new Date('2026-05-20T11:30:00Z').toISOString()
    },
    {
      id: 'log_ae_3',
      clientId: 'cli_ae_2',
      clientName: 'Vortex Analytics Corp',
      companyId: 'co_aether',
      loggedById: 'usr_ae_admin',
      loggedByName: 'Elena Rostova',
      mode: 'EMAIL',
      notes: 'Pushed welcome onboarding templates. Configured custom department queues for their incoming team leadership leads.',
      createdAt: new Date('2026-05-12T09:12:00Z').toISOString()
    },

    // Zenith Communication History
    {
      id: 'log_ze_1',
      clientId: 'cli_ze_1',
      clientName: 'Hyperion Holdings',
      companyId: 'co_zenith',
      loggedById: 'usr_ze_leader',
      loggedByName: 'Sophia Dubois',
      mode: 'CALL',
      notes: 'Kick-off phone discussion for product consulting mappings. Agreed to standard biweekly deliverables.',
      createdAt: new Date('2026-05-20T14:00:00Z').toISOString()
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'not_ae_1',
      userId: 'usr_ae_emp1',
      companyId: 'co_aether',
      title: 'Critical Task Assigned: Optimize DB Latency',
      message: 'You have been assigned the DB Optimization task by Marcus Vance. Deadline June 15.',
      isRead: false,
      type: 'TASK_ASSIGNED',
      createdAt: new Date('2026-05-18T09:01:00Z').toISOString()
    },
    {
      id: 'not_ae_2',
      userId: 'usr_ae_emp1',
      companyId: 'co_aether',
      title: 'Task Overdue Reminder',
      message: 'Task: Migrate Outdated Webpack Bundles is currently marked overdue. Please update state comments.',
      isRead: true,
      type: 'TASK_OVERDUE',
      createdAt: new Date('2026-05-11T09:00:00Z').toISOString()
    },
    {
      id: 'not_ae_3',
      userId: 'usr_ae_emp2',
      companyId: 'co_aether',
      title: 'Action Required: High Priority Assignment',
      message: 'Elena Rostova assigned you to Revamp SaaS Marketing Collaterals.',
      isRead: false,
      type: 'TASK_ASSIGNED',
      createdAt: new Date('2026-05-20T10:01:00Z').toISOString()
    },
    {
      id: 'not_ae_4',
      userId: 'usr_ae_admin',
      companyId: 'co_aether',
      title: 'System Initialized',
      message: 'Welcome to WorkDesk, Elena. Multi-tenant secure structures and encryption parameters are initialized.',
      isRead: false,
      type: 'WELCOME',
      createdAt: new Date('2026-05-10T08:00:00Z').toISOString()
    }
  ];

  return {
    companies,
    users,
    teams,
    tasks,
    performanceScores,
    clients,
    communicationLogs,
    notifications
  };
}

// Supabase Auto-Seeding controller (Only executes on an empty connected DB)
async function ensureSupabaseSeeded() {
  if (!isSupabaseEnabled || !supabase || isSeedingCompleted) return;

  try {
    const { count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[Supabase DB Loader] Verification failed, check your table definitions or SQL schema.', error);
      return;
    }

    if (count === 0) {
      console.log('⚡ [Supabase DB Loader] Detected fresh empty database tables. Seeding default multi-tenant personas...');
      const seeds = generateInitialSeeds();

      for (const co of seeds.companies) {
        await supabase.from('companies').upsert({ id: co.id, data: co });
      }
      for (const usr of seeds.users) {
        await supabase.from('users').upsert({ id: usr.id, company_id: usr.companyId, email: usr.email.toLowerCase(), data: usr });
      }
      for (const team of seeds.teams) {
        await supabase.from('teams').upsert({ id: team.id, company_id: team.companyId, data: team });
      }
      for (const t of seeds.tasks) {
        await supabase.from('tasks').upsert({ id: t.id, company_id: t.companyId, data: t });
      }
      for (const perf of seeds.performanceScores) {
        await supabase.from('performance_scores').upsert({ id: perf.id, company_id: perf.companyId, user_id: perf.userId, data: perf });
      }
      for (const cli of seeds.clients) {
        await supabase.from('clients').upsert({ id: cli.id, company_id: cli.companyId, data: cli });
      }
      for (const log of seeds.communicationLogs) {
        await supabase.from('communication_logs').upsert({ id: log.id, company_id: log.companyId, data: log });
      }
      for (const notif of seeds.notifications) {
        await supabase.from('notifications').upsert({ id: notif.id, company_id: notif.companyId, user_id: notif.userId, data: notif });
      }

      console.log('🎉 [Supabase DB Loader] Tables seeded correctly with production test credentials.');
    }
    isSeedingCompleted = true;
  } catch (err) {
    console.error('Failed to run Supabase DB autoseed logic:', err);
  }
}

// Scalable query and mutation operations supporting Dual local file-persistence and Production-ready Supabase DB
export const db = {
  // Companies
  async getCompanies(): Promise<Company[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('companies').select('data');
      if (error) {
        console.error('Supabase getCompanies error:', error);
        return [];
      }
      return (data || []).map(r => r.data as Company);
    }
    ensureDb();
    return dbCache!.companies;
  },

  async getCompanyById(id: string): Promise<Company | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('companies').select('data').eq('id', id).maybeSingle();
      if (error) {
        console.error('Supabase getCompanyById error:', error);
        return null;
      }
      return data ? (data.data as Company) : null;
    }
    ensureDb();
    return dbCache!.companies.find(c => c.id === id) || null;
  },

  async saveCompany(co: Company): Promise<Company> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('companies').upsert({ id: co.id, data: co });
      if (error) {
        console.error('Supabase saveCompany error:', error);
        throw error;
      }
      return co;
    }
    ensureDb();
    const idx = dbCache!.companies.findIndex(c => c.id === co.id);
    if (idx >= 0) {
      dbCache!.companies[idx] = co;
    } else {
      dbCache!.companies.push(co);
    }
    saveDb();
    return co;
  },

  // Users
  async getUsers(companyId?: string): Promise<User[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      let query = supabase.from('users').select('data');
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Supabase getUsers error:', error);
        return [];
      }
      return (data || []).map(r => r.data as User);
    }
    ensureDb();
    if (companyId) {
      return dbCache!.users.filter(u => u.companyId === companyId);
    }
    return dbCache!.users;
  },

  async getUserById(id: string, companyId?: string): Promise<User | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      let query = supabase.from('users').select('data').eq('id', id);
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error('Supabase getUserById error:', error);
        return null;
      }
      return data ? (data.data as User) : null;
    }
    ensureDb();
    const user = dbCache!.users.find(u => u.id === id);
    if (!user) return null;
    if (companyId && user.companyId !== companyId) return null;
    return user;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase
        .from('users')
        .select('data')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (error) {
        console.error('Supabase getUserByEmail error:', error);
        return null;
      }
      return data ? (data.data as User) : null;
    }
    ensureDb();
    return dbCache!.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async saveUser(user: User): Promise<User> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        company_id: user.companyId,
        email: user.email.toLowerCase(),
        data: user
      });
      if (error) {
        console.error('Supabase saveUser error:', error);
        throw error;
      }
      return user;
    }
    ensureDb();
    const idx = dbCache!.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      dbCache!.users[idx] = user;
    } else {
      dbCache!.users.push(user);
    }
    saveDb();
    return user;
  },

  async deleteUser(id: string, companyId: string): Promise<boolean> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        console.error('Supabase deleteUser error:', error);
        return false;
      }
      return true;
    }
    ensureDb();
    const len = dbCache!.users.length;
    dbCache!.users = dbCache!.users.filter(u => !(u.id === id && u.companyId === companyId));
    if (dbCache!.users.length !== len) {
      saveDb();
      return true;
    }
    return false;
  },

  // Teams
  async getTeams(companyId: string): Promise<Team[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('teams').select('data').eq('company_id', companyId);
      if (error) {
        console.error('Supabase getTeams error:', error);
        return [];
      }
      return (data || []).map(r => r.data as Team);
    }
    ensureDb();
    return dbCache!.teams.filter(t => t.companyId === companyId);
  },

  async getTeamById(id: string, companyId: string): Promise<Team | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase
        .from('teams')
        .select('data')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) {
        console.error('Supabase getTeamById error:', error);
        return null;
      }
      return data ? (data.data as Team) : null;
    }
    ensureDb();
    return dbCache!.teams.find(t => t.id === id && t.companyId === companyId) || null;
  },

  async saveTeam(team: Team): Promise<Team> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('teams').upsert({
        id: team.id,
        company_id: team.companyId,
        data: team
      });
      if (error) {
        console.error('Supabase saveTeam error:', error);
        throw error;
      }
      return team;
    }
    ensureDb();
    const idx = dbCache!.teams.findIndex(t => t.id === team.id && t.companyId === team.companyId);
    if (idx >= 0) {
      dbCache!.teams[idx] = team;
    } else {
      dbCache!.teams.push(team);
    }
    saveDb();
    return team;
  },

  async deleteTeam(id: string, companyId: string): Promise<boolean> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        console.error('Supabase deleteTeam error:', error);
        return false;
      }
      return true;
    }
    ensureDb();
    const len = dbCache!.teams.length;
    dbCache!.teams = dbCache!.teams.filter(t => !(t.id === id && t.companyId === companyId));
    if (dbCache!.teams.length !== len) {
      saveDb();
      return true;
    }
    return false;
  },

  // Tasks
  async getTasks(companyId: string): Promise<Task[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('tasks').select('data').eq('company_id', companyId);
      if (error) {
        console.error('Supabase getTasks error:', error);
        return [];
      }
      return (data || []).map(r => r.data as Task);
    }
    ensureDb();
    return dbCache!.tasks.filter(t => t.companyId === companyId);
  },

  async getTaskById(id: string, companyId: string): Promise<Task | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase
        .from('tasks')
        .select('data')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) {
        console.error('Supabase getTaskById error:', error);
        return null;
      }
      return data ? (data.data as Task) : null;
    }
    ensureDb();
    return dbCache!.tasks.find(t => t.id === id && t.companyId === companyId) || null;
  },

  async saveTask(task: Task): Promise<Task> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('tasks').upsert({
        id: task.id,
        company_id: task.companyId,
        data: task
      });
      if (error) {
        console.error('Supabase saveTask error:', error);
        throw error;
      }
      return task;
    }
    ensureDb();
    const idx = dbCache!.tasks.findIndex(t => t.id === task.id && t.companyId === task.companyId);
    if (idx >= 0) {
      dbCache!.tasks[idx] = task;
    } else {
      dbCache!.tasks.push(task);
    }
    saveDb();
    return task;
  },

  async deleteTask(id: string, companyId: string): Promise<boolean> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        console.error('Supabase deleteTask error:', error);
        return false;
      }
      return true;
    }
    ensureDb();
    const len = dbCache!.tasks.length;
    dbCache!.tasks = dbCache!.tasks.filter(t => !(t.id === id && t.companyId === companyId));
    if (dbCache!.tasks.length !== len) {
      saveDb();
      return true;
    }
    return false;
  },

  // Performance Scores
  async getPerformanceScores(companyId: string): Promise<PerformanceScore[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('performance_scores').select('data').eq('company_id', companyId);
      if (error) {
        console.error('Supabase getPerformanceScores error:', error);
        return [];
      }
      return (data || []).map(r => r.data as PerformanceScore);
    }
    ensureDb();
    return dbCache!.performanceScores.filter(p => p.companyId === companyId);
  },

  async getPerformanceScoreByUserId(userId: string, companyId: string): Promise<PerformanceScore | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase
        .from('performance_scores')
        .select('data')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) {
        console.error('Supabase getPerformanceScoreByUserId error:', error);
        return null;
      }
      return data ? (data.data as PerformanceScore) : null;
    }
    ensureDb();
    return dbCache!.performanceScores.find(p => p.userId === userId && p.companyId === companyId) || null;
  },

  async savePerformanceScore(score: PerformanceScore): Promise<PerformanceScore> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('performance_scores').upsert({
        id: score.id,
        company_id: score.companyId,
        user_id: score.userId,
        data: score
      });
      if (error) {
        console.error('Supabase savePerformanceScore error:', error);
        throw error;
      }
      return score;
    }
    ensureDb();
    const idx = dbCache!.performanceScores.findIndex(p => p.id === score.id && p.companyId === score.companyId);
    if (idx >= 0) {
      dbCache!.performanceScores[idx] = score;
    } else {
      dbCache!.performanceScores.push(score);
    }
    saveDb();
    return score;
  },

  // Clients
  async getClients(companyId: string): Promise<Client[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('clients').select('data').eq('company_id', companyId);
      if (error) {
        console.error('Supabase getClients error:', error);
        return [];
      }
      return (data || []).map(r => r.data as Client);
    }
    ensureDb();
    return dbCache!.clients.filter(c => c.companyId === companyId);
  },

  async getClientById(id: string, companyId: string): Promise<Client | null> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase
        .from('clients')
        .select('data')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) {
        console.error('Supabase getClientById error:', error);
        return null;
      }
      return data ? (data.data as Client) : null;
    }
    ensureDb();
    return dbCache!.clients.find(c => c.id === id && c.companyId === companyId) || null;
  },

  async saveClient(client: Client): Promise<Client> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('clients').upsert({
        id: client.id,
        company_id: client.companyId,
        data: client
      });
      if (error) {
        console.error('Supabase saveClient error:', error);
        throw error;
      }
      return client;
    }
    ensureDb();
    const idx = dbCache!.clients.findIndex(c => c.id === client.id && c.companyId === client.companyId);
    if (idx >= 0) {
      dbCache!.clients[idx] = client;
    } else {
      dbCache!.clients.push(client);
    }
    saveDb();
    return client;
  },

  async deleteClient(id: string, companyId: string): Promise<boolean> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) {
        console.error('Supabase deleteClient error:', error);
        return false;
      }
      return true;
    }
    ensureDb();
    const len = dbCache!.clients.length;
    dbCache!.clients = dbCache!.clients.filter(c => !(c.id === id && c.companyId === companyId));
    if (dbCache!.clients.length !== len) {
      saveDb();
      return true;
    }
    return false;
  },

  // Communication Logs
  async getCommunicationLogs(companyId: string): Promise<CommunicationLog[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase.from('communication_logs').select('data').eq('company_id', companyId);
      if (error) {
        console.error('Supabase getCommunicationLogs error:', error);
        return [];
      }
      return (data || []).map(r => r.data as CommunicationLog);
    }
    ensureDb();
    return dbCache!.communicationLogs.filter(c => c.companyId === companyId);
  },

  async saveCommunicationLog(log: CommunicationLog): Promise<CommunicationLog> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('communication_logs').upsert({
        id: log.id,
        company_id: log.companyId,
        data: log
      });
      if (error) {
        console.error('Supabase saveCommunicationLog error:', error);
        throw error;
      }
      return log;
    }
    ensureDb();
    dbCache!.communicationLogs.push(log);
    saveDb();
    return log;
  },

  // Notifications
  async getNotifications(userId: string, companyId: string): Promise<Notification[]> {
    if (isSupabaseEnabled && supabase) {
      await ensureSupabaseSeeded();
      const { data, error } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', userId)
        .eq('company_id', companyId);
      if (error) {
        console.error('Supabase getNotifications error:', error);
        return [];
      }
      return (data || []).map(r => r.data as Notification);
    }
    ensureDb();
    return dbCache!.notifications.filter(n => n.userId === userId && n.companyId === companyId);
  },

  async saveNotification(notif: Notification): Promise<Notification> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('notifications').upsert({
        id: notif.id,
        company_id: notif.companyId,
        user_id: notif.userId,
        data: notif
      });
      if (error) {
        console.error('Supabase saveNotification error:', error);
        throw error;
      }
      return notif;
    }
    ensureDb();
    dbCache!.notifications.push(notif);
    saveDb();
    return notif;
  },

  async markNotificationAsRead(id: string, userId: string, companyId: string): Promise<boolean> {
    if (isSupabaseEnabled && supabase) {
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('data')
        .eq('id', id)
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();
      if (fetchErr || !data) return false;
      const notifObj = data.data as Notification;
      notifObj.isRead = true;
      const { error: saveErr } = await supabase.from('notifications').upsert({
        id,
        company_id: companyId,
        user_id: userId,
        data: notifObj
      });
      return !saveErr;
    }
    ensureDb();
    const notif = dbCache!.notifications.find(n => n.id === id && n.userId === userId && n.companyId === companyId);
    if (notif) {
      notif.isRead = true;
      saveDb();
      return true;
    }
    return false;
  },

  async markAllNotificationsAsRead(userId: string, companyId: string): Promise<void> {
    if (isSupabaseEnabled && supabase) {
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', userId)
        .eq('company_id', companyId);
      if (fetchErr || !data) return;
      for (const row of data) {
        const notifObj = row.data as Notification;
        if (!notifObj.isRead) {
          notifObj.isRead = true;
          await supabase.from('notifications').upsert({
            id: notifObj.id,
            company_id: companyId,
            user_id: userId,
            data: notifObj
          });
        }
      }
      return;
    }
    ensureDb();
    dbCache!.notifications.forEach(n => {
      if (n.userId === userId && n.companyId === companyId) {
        n.isRead = true;
      }
    });
    saveDb();
  }
};
