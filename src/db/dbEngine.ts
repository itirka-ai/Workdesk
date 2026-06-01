/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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

// Database query APIs enforcing strict tenant isolation if needed
export const db = {
  // Companies
  getCompanies(): Company[] {
    ensureDb();
    return dbCache!.companies;
  },
  getCompanyById(id: string): Company | null {
    ensureDb();
    return dbCache!.companies.find(c => c.id === id) || null;
  },
  saveCompany(co: Company): Company {
    ensureDb();
    dbCache!.companies.push(co);
    saveDb();
    return co;
  },

  // Users
  getUsers(companyId?: string): User[] {
    ensureDb();
    if (companyId) {
      return dbCache!.users.filter(u => u.companyId === companyId);
    }
    return dbCache!.users;
  },
  getUserById(id: string, companyId?: string): User | null {
    ensureDb();
    const user = dbCache!.users.find(u => u.id === id);
    if (!user) return null;
    if (companyId && user.companyId !== companyId) return null;
    return user;
  },
  getUserByEmail(email: string): User | null {
    ensureDb();
    return dbCache!.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  saveUser(user: User): User {
    ensureDb();
    // Exclude duplicates
    const idx = dbCache!.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      dbCache!.users[idx] = user;
    } else {
      dbCache!.users.push(user);
    }
    saveDb();
    return user;
  },
  deleteUser(id: string, companyId: string): boolean {
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
  getTeams(companyId: string): Team[] {
    ensureDb();
    return dbCache!.teams.filter(t => t.companyId === companyId);
  },
  getTeamById(id: string, companyId: string): Team | null {
    ensureDb();
    return dbCache!.teams.find(t => t.id === id && t.companyId === companyId) || null;
  },
  saveTeam(team: Team): Team {
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
  deleteTeam(id: string, companyId: string): boolean {
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
  getTasks(companyId: string): Task[] {
    ensureDb();
    return dbCache!.tasks.filter(t => t.companyId === companyId);
  },
  getTaskById(id: string, companyId: string): Task | null {
    ensureDb();
    return dbCache!.tasks.find(t => t.id === id && t.companyId === companyId) || null;
  },
  saveTask(task: Task): Task {
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
  deleteTask(id: string, companyId: string): boolean {
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
  getPerformanceScores(companyId: string): PerformanceScore[] {
    ensureDb();
    return dbCache!.performanceScores.filter(p => p.companyId === companyId);
  },
  getPerformanceScoreByUserId(userId: string, companyId: string): PerformanceScore | null {
    ensureDb();
    return dbCache!.performanceScores.find(p => p.userId === userId && p.companyId === companyId) || null;
  },
  savePerformanceScore(score: PerformanceScore): PerformanceScore {
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
  getClients(companyId: string): Client[] {
    ensureDb();
    return dbCache!.clients.filter(c => c.companyId === companyId);
  },
  getClientById(id: string, companyId: string): Client | null {
    ensureDb();
    return dbCache!.clients.find(c => c.id === id && c.companyId === companyId) || null;
  },
  saveClient(client: Client): Client {
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
  deleteClient(id: string, companyId: string): boolean {
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
  getCommunicationLogs(companyId: string): CommunicationLog[] {
    ensureDb();
    return dbCache!.communicationLogs.filter(c => c.companyId === companyId);
  },
  saveCommunicationLog(log: CommunicationLog): CommunicationLog {
    ensureDb();
    dbCache!.communicationLogs.push(log);
    saveDb();
    return log;
  },

  // Notifications
  getNotifications(userId: string, companyId: string): Notification[] {
    ensureDb();
    return dbCache!.notifications.filter(n => n.userId === userId && n.companyId === companyId);
  },
  saveNotification(notif: Notification): Notification {
    ensureDb();
    dbCache!.notifications.push(notif);
    saveDb();
    return notif;
  },
  markNotificationAsRead(id: string, userId: string, companyId: string): boolean {
    ensureDb();
    const notif = dbCache!.notifications.find(n => n.id === id && n.userId === userId && n.companyId === companyId);
    if (notif) {
      notif.isRead = true;
      saveDb();
      return true;
    }
    return false;
  },
  markAllNotificationsAsRead(userId: string, companyId: string): void {
    ensureDb();
    dbCache!.notifications.forEach(n => {
      if (n.userId === userId && n.companyId === companyId) {
        n.isRead = true;
      }
    });
    saveDb();
  }
};
