/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/dbEngine';
import { User, UserRole, Task, TaskStatus, TaskPriority, Notification, Client, CommunicationLog, Team } from './src/types';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'workdesk_super_secret_jwt_key_2026';

app.use(express.json());

// Extend express requests to hold tenant workspace info and active users
interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
  companyId?: string;
}

// Global Activity Logging service
function logSystemActivity(companyId: string, message: string) {
  console.log(`[ACTIVITY LOG - ${companyId}]: ${message}`);
}

// Interactive Email Generator Logger
function simulateEmailNotification(to: string, senderName: string, subject: string, bodyTemplate: string) {
  console.log(`
=========================================
EMAIL NOTIFICATION SENT SUCCESSFULLY
=========================================
To: ${to}
Subject: ${subject}
From: WorkDesk Mailer <notification@workdesk.com>
-----------------------------------------
Hi there,

${bodyTemplate}

-----------------------------------------
Need assistance? Contact support@workdesk.com
WorkDesk B2B SaaS Platform © 2026
=========================================
`);
}

// Authentication check middleware (Async to support Supabase lookups securely)
async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing or improperly formed.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string };
    const user = await db.getUserById(decoded.userId, decoded.companyId);

    if (!user) {
      return res.status(401).json({ error: 'User account or company association is invalid.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'This user account has been suspended/deactivated. Access is denied.' });
    }

    const { passwordHash, ...userProfile } = user;
    req.user = userProfile;
    req.companyId = decoded.companyId;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Session token has expired or is invalid.' });
  }
}

// --- API ROUTES ---

// 1. AUTH SYSTEM

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required credentials.' });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password associated with this platform.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password associated with this platform.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'This user account has been deactivated or removed by the administrator. Access is restricted.' });
    }

    const company = await db.getCompanyById(user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Associated company profile could not be found.' });
    }

    // Sign complete JWT
    const token = jwt.sign(
      { userId: user.id, companyId: user.companyId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash, ...userProfile } = user;

    logSystemActivity(user.companyId, `User ${user.name} (${user.role}) logged in successfully.`);

    return res.json({
      user: userProfile,
      company,
      token
    });
  } catch (err: any) {
    console.error('Login routing error', err);
    return res.status(500).json({ error: 'An unexpected authentication error occurred on our server.' });
  }
});

// Signup for New B2B Enterprise Workspace Demo
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { companyName, companyDomain, adminName, adminEmail, adminPassword } = req.body;

  if (!companyName || !companyDomain || !adminName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'All fields are strictly required to instantiate a new enterprise tenant.' });
  }

  try {
    // Check if email already exists
    const existingUser = await db.getUserByEmail(adminEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'A user account with this email address already exists.' });
    }

    // 1. Create Company ID
    const companyId = `co_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}`;
    const newCompany = await db.saveCompany({
      id: companyId,
      name: companyName,
      domain: companyDomain,
      createdAt: new Date().toISOString()
    });

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // 3. Save Admin User
    const adminId = `usr_adm_${Date.now().toString().slice(-6)}`;
    const newAdmin = await db.saveUser({
      id: adminId,
      name: adminName,
      email: adminEmail,
      role: UserRole.ADMIN,
      department: 'Executive Leadership',
      companyId: companyId,
      createdAt: new Date().toISOString(),
      passwordHash
    });

    // 4. Set Initial Performance Score Template for Admin
    await db.savePerformanceScore({
      id: `perf_${adminId}`,
      userId: adminId,
      companyId: companyId,
      monthYear: '05/2026',
      taskCompletionRate: 100,
      deadlineAdherence: 100,
      productivityScore: 100,
      responseTime: 0,
      attendanceConsistency: 100,
      updatedAt: new Date().toISOString()
    });

    // 5. Send onboarding email simulation
    simulateEmailNotification(
      adminEmail,
      'WorkDesk Core',
      'Welcome to WorkDesk Workspace Deployment',
      `Welcome ${adminName}! Your enterprise tenant workspace "${companyName}" is live on WorkDesk.
Access controls are set to tenant level: "${companyId}".
Your credentials are live. Feel free to invite team leaders and employees to collaborate.`
    );

    // 6. Return standard log-in token bundle
    const token = jwt.sign(
      { userId: newAdmin.id, companyId: companyId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash: _, ...userProfile } = newAdmin;

    logSystemActivity(companyId, `New enterprise signup configured for "${companyName}". Admin created.`);

    return res.status(201).json({
      user: userProfile,
      company: newCompany,
      token
    });
  } catch (err: any) {
    console.error('Signup error', err);
    return res.status(500).json({ error: 'Could not configure enterprise signup workspace.' });
  }
});

// Me Profile Token Verification
app.get('/api/auth/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const company = await db.getCompanyById(req.companyId!);
    if (!company) {
      return res.status(404).json({ error: 'Company workspace association matches a defunct resource.' });
    }
    return res.json({
      user: req.user,
      company
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify me profile.' });
  }
});

// Change Password Endpoint
app.put('/api/auth/change-password', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Your new password must be at least 6 characters in length.' });
  }

  try {
    const fullUser = await db.getUserById(req.user!.id, req.companyId!);
    if (!fullUser || !fullUser.passwordHash) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const validPassword = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'The current password entered is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    fullUser.passwordHash = newHash;
    await db.saveUser(fullUser);

    logSystemActivity(req.companyId!, `User ${req.user!.name} changed their secure account password.`);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Password change error', err);
    return res.status(500).json({ error: 'Could not update your password inside company workspace registries.' });
  }
});



// 2. TASK CONVENTIONS (Multi-Tenant, Role Protected)

// Get all tasks (enforcing strict tenant bounds)
app.get('/api/tasks', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allTasks = await db.getTasks(req.companyId!);

    // If user is employee, filter to show ONLY their assigned tasks
    if (req.user?.role === UserRole.EMPLOYEE) {
      const filtered = allTasks.filter(t => t.assignedTo === req.user?.id);
      return res.json(filtered);
    }

    return res.json(allTasks);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to query tasks.' });
  }
});

// Retrieve specific Task Detailed Page
app.get('/api/tasks/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const task = await db.getTaskById(id, req.companyId!);

    if (!task) {
      return res.status(404).json({ error: 'Task detail could not be loaded or belongs to another tenant partition.' });
    }

    // Employee guard checking
    if (req.user?.role === UserRole.EMPLOYEE && task.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'You are unauthorized to view private task details outside your scope.' });
    }

    return res.json(task);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load task details.' });
  }
});

// Create task (Admin & Leaders Only)
app.post('/api/tasks', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, assignedTo, deadline, priority, recurringType, isFutureScheduled, scheduledDate } = req.body;

  if (req.user?.role === UserRole.EMPLOYEE) {
    return res.status(403).json({ error: 'Employees do not possess permissions to define task schemas.' });
  }

  if (!title || !description || !assignedTo || !deadline || !priority) {
    return res.status(400).json({ error: 'Title, description, assignee, deadline constraint, and priority tier are required.' });
  }

  try {
    // Verify assignee exists in same tenant
    const assignee = await db.getUserById(assignedTo, req.companyId!);
    if (!assignee) {
      return res.status(400).json({ error: 'Assignee does not belong to your company tenant.' });
    }

    const taskId = `tsk_${Date.now().toString().slice(-6)}`;
    const initialAttachments = req.body.attachments || [];
    
    const newTask: Task = {
      id: taskId,
      companyId: req.companyId!,
      title,
      description,
      assignedTo,
      createdBy: req.user!.id,
      deadline,
      priority: priority as TaskPriority,
      status: TaskStatus.PENDING,
      progress: 0,
      recurringType: (recurringType as any) || 'NONE',
      isFutureScheduled: !!isFutureScheduled,
      scheduledDate,
      attachments: initialAttachments,
      comments: [],
      activityLogs: [{
        id: `act_${Date.now()}_0`,
        userId: req.user!.id,
        userName: req.user!.name,
        action: initialAttachments.length > 0 
          ? `Task created (with ${initialAttachments.length} attachments) and assigned to ${assignee.name}`
          : `Task created and assigned to ${assignee.name}`,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    await db.saveTask(newTask);

    // Notify employee via inside alerts pool
    await db.saveNotification({
      id: `not_${Date.now().toString().slice(-6)}`,
      userId: assignedTo,
      companyId: req.companyId!,
      title: `New Task Assigned: ${title}`,
      message: `You have been assigned "${title}" by ${req.user!.name}. Finish target deadline is ${new Date(deadline).toLocaleDateString()}.`,
      isRead: false,
      type: 'TASK_ASSIGNED',
      createdAt: new Date().toISOString()
    });

    // Simulating the automatic mail service trigger
    simulateEmailNotification(
      assignee.email,
      req.user!.name,
      `[WorkDesk Assignment]: ${title}`,
      `Hi ${assignee.name},

You have been assigned a new task: "${title}".
Assigned By: ${req.user!.name}
Target Deadline: ${new Date(deadline).toLocaleString()}
Priority Rating: ${priority}

Please sign in to WorkDesk to review specifications and record progress.`
    );

    logSystemActivity(req.companyId!, `Created task "${title}" assigned to ${assignee.name}.`);

    return res.status(201).json(newTask);
  } catch (err) {
    console.error('Task creation routing error:', err);
    return res.status(500).json({ error: 'Failed to persist task.' });
  }
});

// Update Task (Progress, status, comments addition, file uploads)
app.put('/api/tasks/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await db.getTaskById(id, req.companyId!);

    if (!task) {
      return res.status(404).json({ error: 'Task detail could not be updated or tenant ID matches failed references.' });
    }

    // Access check
    if (req.user?.role === UserRole.EMPLOYEE && task.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify tasks that are not yours.' });
    }

    const { title, description, assignedTo, deadline, priority, status, progress, commentContent, attachmentFile } = req.body;

    let activityMessage = '';

    // Handle new comments appending
    if (commentContent) {
      const commentId = `cmt_${Date.now().toString().slice(-6)}`;
      const newComment = {
        id: commentId,
        taskId: id,
        commenterId: req.user!.id,
        commenterName: req.user!.name,
        commenterRole: req.user!.role,
        content: commentContent,
        createdAt: new Date().toISOString()
      };
      task.comments.push(newComment);
      activityMessage = `Added a comment: "${commentContent.substring(0, 40)}${commentContent.length > 40 ? '...' : ''}"`;
    }

    // Handle mock attachments payload uploading
    if (attachmentFile && attachmentFile.name) {
      task.attachments.push({
        name: attachmentFile.name,
        url: attachmentFile.url || '#',
        uploadedBy: req.user!.name,
        uploadedAt: new Date().toISOString(),
        size: attachmentFile.size || '420 KB'
      });
      activityMessage = `Uploaded proof file: "${attachmentFile.name}"`;
    }

    // Status mapping change rules
    if (status !== undefined && status !== task.status) {
      const formerState = task.status;
      task.status = status as TaskStatus;

      if (task.status === TaskStatus.COMPLETED) {
        task.progress = 100;
      }

      activityMessage = `Status updated from [${formerState}] to [${task.status}]`;

      // Trigger Notification for assigner if employee updates status
      if (req.user!.role === UserRole.EMPLOYEE) {
        await db.saveNotification({
          id: `not_${Date.now().toString().slice(-6)}`,
          userId: task.createdBy,
          companyId: req.companyId!,
          title: `Task Status Alert: ${task.title}`,
          message: `${req.user!.name} updated "${task.title}" to ${task.status}.`,
          isRead: false,
          type: 'SYSTEM',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Progress rating slider updates
    if (progress !== undefined && progress !== task.progress) {
      task.progress = Number(progress);
      if (!activityMessage) {
        activityMessage = `Completion progress adjusted to ${progress}%`;
      }
    }

    // Only admin and leaders can update high-level meta details like title, deadline or assignee
    if (req.user!.role !== UserRole.EMPLOYEE) {
      if (title) task.title = title;
      if (description) task.description = description;

      if (assignedTo && assignedTo !== task.assignedTo) {
        const formerAssignee = await db.getUserById(task.assignedTo, req.companyId!);
        const newAssignee = await db.getUserById(assignedTo, req.companyId!);
        if (newAssignee) {
          if (req.user!.role === UserRole.TEAM_LEADER) {
            const leaderTeams = (await db.getTeams(req.companyId!)).filter(t => t.leaderId === req.user!.id);
            const isMember = leaderTeams.some(t => t.employeeIds.includes(assignedTo)) || assignedTo === req.user!.id;
            if (!isMember) {
              return res.status(403).json({ error: 'Team leaders can only delegate/pass tasks to employees in their own team.' });
            }
          }
          task.assignedTo = assignedTo;
          activityMessage = `Reassigned from ${formerAssignee?.name || 'Unassigned'} to ${newAssignee.name}`;

          // Signal new employee
          await db.saveNotification({
            id: `not_${Date.now().toString().slice(-6)}`,
            userId: assignedTo,
            companyId: req.companyId!,
            title: `Reassigned Task: ${task.title}`,
            message: `You are now assigned to build "${task.title}". Managed by ${req.user!.name}.`,
            isRead: false,
            type: 'TASK_ASSIGNED',
            createdAt: new Date().toISOString()
          });
        }
      }

      if (deadline) task.deadline = deadline;
      if (priority) task.priority = priority as TaskPriority;
    }

    // Push activity log
    if (activityMessage) {
      task.activityLogs.push({
        id: `act_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 5)}`,
        userId: req.user!.id,
        userName: req.user!.name,
        action: activityMessage,
        timestamp: new Date().toISOString()
      });
    }

    await db.saveTask(task);

    // Recalculate employee performance indicators dynamically!
    if (task.status === TaskStatus.COMPLETED) {
      const assigneeScores = await db.getPerformanceScoreByUserId(task.assignedTo, req.companyId!);
      if (assigneeScores) {
        const allEmpTasks = (await db.getTasks(req.companyId!)).filter(t => t.assignedTo === task.assignedTo);
        const finished = allEmpTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        assigneeScores.taskCompletionRate = Math.round((finished / allEmpTasks.length) * 100);

        // Check deadline matching
        const onTime = allEmpTasks.filter(t => {
          if (t.status !== TaskStatus.COMPLETED) return false;
          const deadlineDate = new Date(t.deadline);
          const completionDate = new Date();
          return completionDate <= deadlineDate;
        }).length;

        assigneeScores.deadlineAdherence = allEmpTasks.filter(t => t.status === TaskStatus.COMPLETED).length > 0
          ? Math.round((onTime / allEmpTasks.filter(t => t.status === TaskStatus.COMPLETED).length) * 100)
          : 100;

        // Bump overall scoring index
        assigneeScores.productivityScore = Math.min(100, Math.round((assigneeScores.taskCompletionRate + assigneeScores.deadlineAdherence) / 2) + 5);
        assigneeScores.updatedAt = new Date().toISOString();
        await db.savePerformanceScore(assigneeScores);
      }
    }

    return res.json(task);
  } catch (err: any) {
    console.error('Task update error:', err);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Delete Task (Admin Only)
app.delete('/api/tasks/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Only administrative personnel can fully remove task definitions.' });
  }

  const { id } = req.params;
  try {
    const deleted = await db.deleteTask(id, req.companyId!);

    if (!deleted) {
      return res.status(404).json({ error: 'Task lookup failed for deletion.' });
    }

    logSystemActivity(req.companyId!, `Administrator permanently purged Task ID [${id}]`);
    return res.json({ success: true, message: `Task ID [${id}] has been permanently deleted.` });
  } catch (err) {
    return res.status(500).json({ error: 'Task deletion error.' });
  }
});


// 3. EMPLOYEE & DEPARTMENTS MANAGEMENT (Multi-Tenant)

// Get all staff users (tenant safe, client gets non-sensitive profiles)
app.get('/api/employees', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await db.getUsers(req.companyId!);
    // Format profiles safely
    const safeStaff = staff.map(({ passwordHash, ...safeUser }) => safeUser);
    return res.json(safeStaff);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get personnel.' });
  }
});

// Create Employee (Admin only)
app.post('/api/employees', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Administrative rank is required to scale personnel resources.' });
  }

  const { name, email, role, department, phone, password } = req.body;

  if (!name || !email || !role || !department || !password) {
    return res.status(400).json({ error: 'Name, email, target role, department mapping, and secure password are required.' });
  }

  try {
    const exists = await db.getUserByEmail(email);
    if (exists) {
      return res.status(400).json({ error: 'An account with this email address already matches a record.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const empId = `usr_staff_${Date.now().toString().slice(-6)}`;
    const newEmployee = await db.saveUser({
      id: empId,
      name,
      email,
      role: role as UserRole,
      department,
      companyId: req.companyId!,
      phone,
      createdAt: new Date().toISOString(),
      passwordHash
    });

    // Seed empty performance dashboard tracking metrics
    await db.savePerformanceScore({
      id: `perf_${empId}`,
      userId: empId,
      companyId: req.companyId!,
      monthYear: '05/2026',
      taskCompletionRate: 0,
      deadlineAdherence: 100,
      productivityScore: 75,
      responseTime: 2.0,
      attendanceConsistency: 95,
      updatedAt: new Date().toISOString()
    });

    // Notify employee email sandbox
    simulateEmailNotification(
      email,
      req.user!.name,
      'Welcome to WorkDesk Workspace',
      `Welcome ${name}!

Your corporate account has been deployed on WorkDesk by Administrator ${req.user!.name}.
Your Roles: ${role}
Your Primary Department: ${department}
Please log in using your email credentials and default secure passwords.`
    );

    const { passwordHash: _, ...safeProfile } = newEmployee;
    logSystemActivity(req.companyId!, `Created Employee User ${name} inside department ${department}.`);

    return res.status(201).json(safeProfile);
  } catch (err) {
    console.error('Add Employee Error', err);
    return res.status(500).json({ error: 'Internal system fault assigning new employee profile.' });
  }
});

// Edit Employee (Admin only)
app.put('/api/employees/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Only administrators may alter role models.' });
  }

  const { id } = req.params;
  try {
    const staffUser = await db.getUserById(id, req.companyId!);

    if (!staffUser) {
      return res.status(404).json({ error: 'Personnel profile not found inside your company tenant.' });
    }

    const { name, role, department, phone, isSuspended } = req.body;

    if (name) staffUser.name = name;
    if (role) staffUser.role = role as UserRole;
    if (department) staffUser.department = department;
    if (phone) staffUser.phone = phone;
    if (isSuspended !== undefined) staffUser.isSuspended = isSuspended;

    await db.saveUser(staffUser);

    const { passwordHash, ...safeResult } = staffUser;
    return res.json(safeResult);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update employee.' });
  }
});

// Delete Employee (Admin only)
app.delete('/api/employees/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Only administrators are authorized to purge records.' });
  }

  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ error: 'You are forbidden from deleting your own root administrative console.' });
  }

  try {
    const success = await db.deleteUser(id, req.companyId!);
    if (!success) {
      return res.status(404).json({ error: 'Personnel record lookup failed for deletion target.' });
    }

    logSystemActivity(req.companyId!, `Purged employee ID [${id}].`);
    return res.json({ success: true, message: 'Personnel record removed from workspace indices configuration.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete employee.' });
  }
});


// 3.5. TEAMS & ORGANIZATIONAL MANAGEMENT (Multi-Tenant)

// Get all Teams
app.get('/api/teams', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teams = await db.getTeams(req.companyId!);
    return res.json(teams);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve teams.' });
  }
});

// Create Team (Admin only)
app.post('/api/teams', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Administrative credentials are required to instantiate teams.' });
  }

  const { name, leaderId, department, employeeIds } = req.body;
  if (!name || !leaderId || !department) {
    return res.status(400).json({ error: 'Team name, leader association, and department mapping are required.' });
  }

  try {
    const teamId = `team_${Date.now().toString().slice(-6)}`;
    const newTeam: Team = {
      id: teamId,
      name,
      companyId: req.companyId!,
      leaderId,
      department,
      employeeIds: employeeIds || [],
      createdAt: new Date().toISOString()
    };

    await db.saveTeam(newTeam);
    logSystemActivity(req.companyId!, `Established Team [${name}] led by member [${leaderId}].`);
    return res.status(201).json(newTeam);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to persist team.' });
  }
});

// Update Team (Admin only)
app.put('/api/teams/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Administrative authority is required to edit structure profiles.' });
  }

  const { id } = req.params;
  try {
    const team = await db.getTeamById(id, req.companyId!);
    if (!team) {
      return res.status(404).json({ error: 'Assigned organizational team record could not be found.' });
    }

    const { name, leaderId, department, employeeIds } = req.body;
    if (name !== undefined) team.name = name;
    if (leaderId !== undefined) team.leaderId = leaderId;
    if (department !== undefined) team.department = department;
    if (employeeIds !== undefined) team.employeeIds = employeeIds;

    await db.saveTeam(team);
    logSystemActivity(req.companyId!, `Updated corporate team hierarchy [${team.name}].`);
    return res.json(team);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update team.' });
  }
});

// Delete/Dismantle Team (Admin only)
app.delete('/api/teams/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Administrative authority is required to purge structural elements.' });
  }

  const { id } = req.params;
  try {
    const success = await db.deleteTeam(id, req.companyId!);
    if (!success) {
      return res.status(404).json({ error: 'Dismantle team target index lookup failed.' });
    }

    logSystemActivity(req.companyId!, `Dismantled organization unit with ID [${id}].`);
    return res.json({ success: true, message: 'Team has been purged from system indexes successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete team.' });
  }
});


// 4. PERFORMANCE TRACKING LEADERBOARDS (Tenant safe)
app.get('/api/performance', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scores = await db.getPerformanceScores(req.companyId!);
    const companyEmployees = await db.getUsers(req.companyId!);

    // Hydrate each score record with matching human name and department data
    const reports = scores.map(score => {
      const matched = companyEmployees.find(e => e.id === score.userId);
      return {
        ...score,
        employeeName: matched?.name || 'Deactivated Team Member',
        role: matched?.role || UserRole.EMPLOYEE,
        department: matched?.department || 'Operations'
      };
    });

    return res.json(reports);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve performance metrics.' });
  }
});


// 5. CLIENT & INTERACTION SYSTEMS (Tenant isolated CRM)

// Get Clients
app.get('/api/clients', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customClients = await db.getClients(req.companyId!);
    return res.json(customClients);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to query client database.' });
  }
});

// Add Client
app.post('/api/clients', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, industry, notes } = req.body;

  if (!name || !email || !phone || !industry) {
    return res.status(400).json({ error: 'Client representation requires Name, Email, Phone contact, and Industry segment.' });
  }

  try {
    const clientId = `cli_${Date.now().toString().slice(-6)}`;
    const newClient: Client = {
      id: clientId,
      companyId: req.companyId!,
      name,
      email,
      phone,
      industry,
      notes,
      createdAt: new Date().toISOString()
    };

    await db.saveClient(newClient);
    logSystemActivity(req.companyId!, `Add Client relationship config for [${name}].`);

    return res.status(201).json(newClient);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to persist client.' });
  }
});

// Log Client Interactions History (CALL, EMAIL, MEETING)
app.get('/api/clients/logs', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await db.getCommunicationLogs(req.companyId!);
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve interaction registries.' });
  }
});

app.post('/api/clients/logs', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { clientId, mode, notes } = req.body;

  if (!clientId || !mode || !notes) {
    return res.status(400).json({ error: 'Interaction history logging requires selection of Client, interaction Mode, and summary notes.' });
  }

  try {
    const client = await db.getClientById(clientId, req.companyId!);
    if (!client) {
      return res.status(404).json({ error: 'Client target reference was not found inside your company tenant Partition.' });
    }

    const logId = `log_${Date.now().toString().slice(-6)}`;
    const newLog: CommunicationLog = {
      id: logId,
      clientId,
      clientName: client.name,
      companyId: req.companyId!,
      loggedById: req.user!.id,
      loggedByName: req.user!.name,
      mode: mode as 'CALL' | 'EMAIL' | 'MEETING',
      notes,
      createdAt: new Date().toISOString()
    };

    await db.saveCommunicationLog(newLog);
    logSystemActivity(req.companyId!, `Logged contact mode ${mode} with ${client.name} reference.`);

    return res.status(201).json(newLog);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record interaction log.' });
  }
});

// 6. NOTIFICATION CHANNELS (Mark Reads)
app.get('/api/notifications', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await db.getNotifications(req.user!.id, req.companyId!);
    return res.json(alerts);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search notifications.' });
  }
});

app.post('/api/notifications/read', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.body;
  try {
    if (id) {
      await db.markNotificationAsRead(id, req.user!.id, req.companyId!);
    } else {
      await db.markAllNotificationsAsRead(req.user!.id, req.companyId!);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification state.' });
  }
});


// --- ENVIRONMENT AND STATIC VITE MIDDLEWARE INTERFACES ---

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite middleware in development container
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Successfully coupled Vite HMR middleware to Express instance.');
  } else {
    // Standard Node Express serving for compiled bundles
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static client coupled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`WorkDesk SaaS MVP Server running securely in Cloud`);
    console.log(`Port binding: ${PORT}`);
    console.log(`Default Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Ready for tenant registrations and task workflows.`);
    console.log(`===================================================`);
  });
}

// Support Vercel serverless vs standalone process
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  bootstrap().catch(err => {
    console.error('Failed to bootstrap express full-stack server application container', err);
  });
}
