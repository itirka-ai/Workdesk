import { UserRole, TaskStatus, TaskPriority } from './src/types';

// Simple lightweight test runner and assertion framework
interface TestStats {
  passed: number;
  failed: number;
  total: number;
}

const stats: TestStats = { passed: 0, failed: 0, total: 0 };
const baseUrl = 'http://localhost:3000';

function assert(condition: boolean, testName: string, errorMsg?: string) {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(` ✅ PASS: ${testName}`);
  } else {
    stats.failed++;
    console.error(` ❌ FAIL: ${testName}`);
    if (errorMsg) {
      console.error(`          Reason: ${errorMsg}`);
    }
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('             WORKDESK SYSTEM INTEGRATION MVP TEST             ');
  console.log('================================================================');
  console.log(`Connected to target environment at: ${baseUrl}`);
  console.log('Checking server availability...');

  try {
    const healthCheck = await fetch(`${baseUrl}/api/tasks`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    // Should return 401 Unauthorized since we didn't send a token, meaning API exists
    assert(healthCheck.status === 401, 'API Server Active (Returns 401 on Unauthorized Access)');
  } catch (err: any) {
    console.error('API server does not appear to be running or responsive on port 3000.', err);
    process.exit(1);
  }

  // Define tokens
  let adminToken = '';
  let leaderToken = '';
  let employeeToken = '';

  // 1. Auth Test Suite
  console.log('\n--- MODULE 1: AUTHENTICATION & SECURITY (JWT) ---');
  try {
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aether.com', password: 'admin123' })
    });
    assert(adminLoginRes.status === 200, 'Admin credentials login successfully');
    const adminData = await adminLoginRes.json();
    adminToken = adminData.token;
    assert(!!adminToken, 'Admin JWT received successfully');
    assert(adminData.user.role === 'ADMIN', 'Logged-in user role is authenticated as ADMIN');
    assert(adminData.company.id === 'co_aether', 'Logged-in user is mapped to right tenant: Aether Dynamics');

    // Invalid credentials check
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aether.com', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Login fails with invalid credentials');
  } catch (e: any) {
    assert(false, 'Auth Test Suite failed to execute', e.message);
  }

  // 2. Fetch User Profile
  console.log('\n--- MODULE 2: USER PROFILE /api/auth/me ---');
  try {
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert(meRes.status === 200, 'Current user profile fetched successfully');
    const meData = await meRes.json();
    assert(meData.user?.email === 'admin@aether.com', 'Profile email matches authenticated user');
  } catch (e: any) {
    assert(false, 'Fetch User Profile failed', e.message);
  }

  // 3. Multi-Tenant Database Isolation Verification
  console.log('\n--- MODULE 3: MULTI-TENANCY DATA SECURITY ISOLATION ---');
  try {
    // Let's login to Zenith Solutions (Zenith Admin)
    const zenithLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@zenith.com', password: 'admin123' })
    });
    assert(zenithLoginRes.status === 200, 'Zenith Admin credentials login successfully');
    const zenithData = await zenithLoginRes.json();
    const zenithToken = zenithData.token;

    // Get Aether dynamic tasks using Zenith token - should fail/not returns Aether tasks
    const aetherTasksRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zenithToken}`
      }
    });
    assert(aetherTasksRes.status === 200, 'Zenith endpoint request succeeds');
    const zenithTasks = await aetherTasksRes.json();
    // In our seed database, Zenith tasks and Aether tasks are distinct. Ensure Zenith admin only gets Zenith items.
    const hasAetherUserAssigned = zenithTasks.some((t: any) => t.assignedTo && t.assignedTo.includes('ae_'));
    assert(!hasAetherUserAssigned, 'Tenant Data Leak Check: Zenith Admin cannot retrieve Aether internal task records');
  } catch (e: any) {
    assert(false, 'Multi-Tenancy verification failed', e.message);
  }

  // 4. Tasks API & Upload Artifact Attachment Suite
  console.log('\n--- MODULE 4: TASKS WORKFLOW AND ARTIFACT DOCUMENT UPLOADS ---');
  let newTaskId = '';
  try {
    // Create new Task
    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Conduct System Performance Optimization MVP',
        description: 'Verify end-to-end telemetry and ensure node resolves native DOMExceptions',
        assignedTo: 'usr_ae_emp1',
        deadline: '2026-06-15',
        priority: 'HIGH'
      })
    });
    assert(createTaskRes.status === 201, 'Admin can create high-priority institutional task');
    const createdTask = await createTaskRes.json();
    newTaskId = createdTask.id;
    assert(createdTask.title === 'Conduct System Performance Optimization MVP', 'Task title recorded correctly');
    assert(createdTask.status === 'PENDING', 'Task defaults to status: PENDING');

    // Commit file artifact proof attachment to task
    const uploadRes = await fetch(`${baseUrl}/api/tasks/${newTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        progress: 40,
        status: 'IN_PROGRESS',
        commentContent: 'Verified node-domexception shimming works',
        attachmentFile: {
          name: 'mvp_verification_report_2026.pdf',
          size: '1.2 MB',
          url: 'https://ais-pre-yxyhfkk7xwnqoui2jgpots-389822732223.asia-east1.run.app/dev-attachment/mvp_verification_report_2026.pdf'
        }
      })
    });
    assert(uploadRes.status === 200, 'Employee can upload file proof and log workspace comment');
    const updatedTask = await uploadRes.json();
    assert(updatedTask.progress === 40, 'Task progress updated to 40%');
    assert(updatedTask.status === 'IN_PROGRESS', 'Task status transitioned to IN_PROGRESS');
    assert(updatedTask.attachments.length > 0, 'Artifact attachment index populated on targeted task');
    assert(updatedTask.attachments[0].name === 'mvp_verification_report_2026.pdf', 'Attachment name correctly matches');
  } catch (e: any) {
    assert(false, 'Tasks & uploads suite failed', e.message);
  }

  // 5. Teams API Structure Verification
  console.log('\n--- MODULE 5: ORGANIZATIONAL TEAMS & DIVISION SEGREGATIONS ---');
  try {
    const teamsRes = await fetch(`${baseUrl}/api/teams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert(teamsRes.status === 200, 'Retrieve organizational teams catalog');
    const teamCatalog = await teamsRes.json();
    assert(teamCatalog.length > 0, 'Seed organizational teams are populated');

    // Create a new Team
    const createTeamRes = await fetch(`${baseUrl}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'MVP Quality Assurance Taskforce',
        department: 'Engineering',
        leaderId: 'usr_ae_leader',
        employeeIds: ['usr_ae_emp1']
      })
    });
    assert(createTeamRes.status === 201, 'Admin can form a custom corporate team and designate Team Leader');
    const newTeam = await createTeamRes.json();
    assert(newTeam.name === 'MVP Quality Assurance Taskforce', 'Team created with expected name');
  } catch (e: any) {
    assert(false, 'Teams API Suite failed', e.message);
  }

  // 6. Access Control & Account Suspension Workflow
  console.log('\n--- MODULE 6: INSTITUTIONAL SECURE ACCESS SUSPENSION CHECK ---');
  try {
    // Let's log in Devon Miller (emp2@aether.com) first to make sure they get suspended
    const empLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'emp2@aether.com', password: 'emp123' })
    });
    assert(empLoginRes.status === 200, 'Employee user credentials login successfully');
    const empData = await empLoginRes.json();
    employeeToken = empData.token;

    // Suspend employee via Admin
    const suspendRes = await fetch(`${baseUrl}/api/employees/usr_ae_emp2`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isSuspended: true })
    });
    assert(suspendRes.status === 200, 'Administrator suspends access for target employee successfully');

    // Try logging in with suspended user - should instantly fail with 403 Forbidden
    const suspendedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'emp2@aether.com', password: 'emp123' })
    });
    assert(suspendedLoginRes.status === 403, 'Logging in as suspended employee is blocked with 403 Forbidden');

    // Reactivate suspended user to revert back state
    const reactivateRes = await fetch(`${baseUrl}/api/employees/usr_ae_emp2`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isSuspended: false })
    });
    assert(reactivateRes.status === 200, 'Administrator restores access for targeted employee successfully');
  } catch (e: any) {
    assert(false, 'Access control / suspension workflow failed', e.message);
  }

  // Done! Summarize tests
  console.log('\n================================================================');
  console.log('                        TEST RUN SUMMARY                        ');
  console.log('================================================================');
  console.log(` TOTAL ASSERTS RUN : ${stats.total}`);
  console.log(` PASSED TESTS      : ${stats.passed}`);
  console.log(` FAILED TESTS      : ${stats.failed}`);
  console.log('================================================================');

  if (stats.failed > 0) {
    console.error(' 🛑 STATUS: AT LEAST ONE SYSTEM TEST FAILED.');
    process.exit(1);
  } else {
    console.log(' 🎉 STATUS: ALL SYSTEM MODULES ARE FULLY FUNCTIONAL!');
    process.exit(0);
  }
}

runTests();
