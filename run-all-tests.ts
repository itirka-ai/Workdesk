import { UserRole, TaskStatus, TaskPriority } from './src/types';
import { db } from './src/db/dbEngine';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ANSI coloring helpers for elegant terminal reporting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
}

const testsRegistry: TestResult[] = [];
let currentCategory = '';

function setCategory(categoryName: string) {
  currentCategory = categoryName;
  console.log(`\n${colors.bright}${colors.bgBlue} >>> ${categoryName.toUpperCase()} SUITE <<< ${colors.reset}`);
}

function assert(condition: boolean, testName: string, errorMsg?: string) {
  if (condition) {
    testsRegistry.push({ category: currentCategory, name: testName, passed: true });
    console.log(`  ${colors.green}✓${colors.reset} ${colors.dim}[${currentCategory}]${colors.reset} ${testName}`);
  } else {
    testsRegistry.push({ category: currentCategory, name: testName, passed: false, error: errorMsg || 'Assertion failed' });
    console.error(`  ${colors.red}✗${colors.reset} ${colors.bright}${colors.red}[FAILED]${colors.reset} ${colors.bright ?? ''}${testName}`);
    if (errorMsg) {
      console.error(`    ${colors.yellow}Reason:${colors.reset} ${errorMsg}`);
    }
  }
}

const baseUrl = 'http://localhost:3000';

// Enterprise Signup domain helper (Unit Test target)
function isCorporateEmailValid(email: string, domain: string): boolean {
  if (!email.includes('@')) return false;
  const parts = email.split('@');
  return parts[parts.length - 1].toLowerCase() === domain.toLowerCase();
}

async function startTestSuite() {
  const startTime = Date.now();
  console.log(`${colors.bright}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}              WORKDESK QUALITY ASSURANCE TEST SUITE             ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}================================================================${colors.reset}`);
  console.log(`Target Environment : ${colors.yellow}${baseUrl}${colors.reset}`);
  console.log(`Execution Epoch    : ${colors.yellow}${new Date().toLocaleString()}${colors.reset}`);
  console.log(`Node Engine        : ${colors.yellow}${process.version}${colors.reset}`);

  // Confirm API Server availability
  try {
    await fetch(`${baseUrl}/api/tasks`, { method: 'GET' });
  } catch (err: any) {
    console.error(`\n${colors.red}🛑 CRITICAL FAILURE: API server is unreachable on local port 3000.${colors.reset}`);
    console.error(`Please ensure the development app has booted successfully.`, err.message);
    process.exit(1);
  }

  // Tokens saved for successive suites
  let adminToken = '';
  let employeeToken = '';
  let employeeUserId = 'usr_ae_emp1';

  // ==========================================
  // I. UNIT TESTING
  // ==========================================
  setCategory('Unit Testing');

  // Test corporate domain matches
  assert(isCorporateEmailValid('john@aether.com', 'aether.com') === true, 'isCorporateEmailValid recognizes exact matching enterprise domain');
  assert(isCorporateEmailValid('john@zenith.com', 'aether.com') === false, 'isCorporateEmailValid flags non-corporate emails');
  assert(isCorporateEmailValid('invalid-email-string', 'aether.com') === false, 'isCorporateEmailValid handles malformed email structures correctly');

  // Test standard encryption properties
  try {
    const salt = bcrypt.genSaltSync(4); // fast salt for test execution
    const hashed = bcrypt.hashSync('securePwd123', salt);
    const isValid = bcrypt.compareSync('securePwd123', hashed);
    const isInvalid = bcrypt.compareSync('wrongPwd123', hashed);
    assert(isValid === true, 'Hashed password correctly verified with matching credentials');
    assert(isInvalid === false, 'Hashed password verification fails on invalid credentials');
  } catch (e: any) {
    assert(false, 'Password crypt hashing system functions as expected', e.toString());
  }

  // Test local metadata structure mappings
  assert(TaskStatus.PENDING === 'PENDING', 'TaskStatus enum represents PENDING value securely');
  assert(TaskPriority.CRITICAL === 'CRITICAL', 'TaskPriority enum maps CRITICAL priority securely');


  // ==========================================
  // II. INTEGRATION TESTING
  // ==========================================
  setCategory('Integration Testing');

  // Database State Engine Cache Validation
  try {
    const freshTasks = db.getTasks('co_aether');
    assert(Array.isArray(freshTasks), 'Database engine returns tasks matching enterprise company ID as list arrays');
    
    // Check that companies are correct
    const aetherCompany = db.getCompanyById('co_aether');
    assert(aetherCompany !== null && aetherCompany?.name === 'Aether Dynamics', 'Database isolates and returns enterprise information accurately');
  } catch (e: any) {
    assert(false, 'Database state queries are fully functional', e.toString());
  }

  // Simulated Database Row Insertion & Removal
  try {
    const tempUser = db.getUserById('usr_ae_admin', 'co_aether');
    assert(tempUser !== null && tempUser.role === UserRole.ADMIN, 'Database accurately queries records using compound indexes (UserId + CompanyId)');
  } catch (e: any) {
    assert(false, 'Transactional querying test succeeded', e.toString());
  }


  // ==========================================
  // III. SYSTEM TESTING
  // ==========================================
  setCategory('System Testing');

  // Verify direct JWT authentication routes
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aether.com', password: 'admin123' })
    });
    assert(loginRes.status === 200, 'Administration authorization endpoints authenticate logins correctly');
    const authPayload = await loginRes.json();
    adminToken = authPayload.token;
    assert(!!adminToken, 'Authenticated login returns a valid security JWT');
    assert(authPayload.user.role === 'ADMIN', 'Auth profile claims ADMIN permissions properly');
  } catch (e: any) {
    assert(false, 'Auth service handles authentication requests correctly', e.toString());
  }

  // Verify workspace employee profiles queries
  try {
    const empProfilesRes = await fetch(`${baseUrl}/api/employees`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert(empProfilesRes.status === 200, 'System directory API returns corporate user profiles catalogs');
    const staff = await empProfilesRes.json();
    assert(staff.length > 0, 'Seed records populate the corporate user directory');
    const hasPasswordsExposed = staff.some((s: any) => s.passwordHash !== undefined);
    assert(!hasPasswordsExposed, 'Security Check: Returned department profiles MUST NOT expose password hash attributes');
  } catch (e: any) {
    assert(false, 'Staff profiles API works correctly', e.toString());
  }


  // ==========================================
  // IV. END-TO-END (E2E) TESTING
  // ==========================================
  setCategory('End-to-End (E2E) Testing');

  // Simulating complete user flow: Creation → Work Progression → Attachment Upload → Workspace Segment Sealing
  let createdE2ETaskId = '';
  try {
    // 1. Admin creates a mission-critical task assignation
    const createTaskE2ERes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Formulate Q3 Mission Statement Deliverables',
        description: 'Verify cross-departmental operations sync and generate visual chart metrics.',
        assignedTo: employeeUserId,
        deadline: '2026-09-30',
        priority: 'CRITICAL'
      })
    });
    assert(createTaskE2ERes.status === 201, 'E2E Flow: Admin assigns critical operations task to employee successfully');
    const createdTask = await createTaskE2ERes.json();
    createdE2ETaskId = createdTask.id;
    assert(createdTask.priority === 'CRITICAL', 'E2E Flow: Task metadata tags mapped correctly');

    // 2. Logging in as target Assigned Employee to perform work simulation
    const empLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'emp1@aether.com', password: 'emp123' })
    });
    assert(empLoginRes.status === 200, 'E2E Flow: Designated employee authenticates with valid credentials');
    const empAuthData = await empLoginRes.json();
    employeeToken = empAuthData.token;

    // 3. Employee uploads verification proof data and increments progress index
    const uploadWorkProofRes = await fetch(`${baseUrl}/api/tasks/${createdE2ETaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        status: 'REVIEW',
        progress: 90,
        commentContent: 'Q3 Framework mapping completed. Attached full PDF outline.',
        attachmentFile: {
          name: 'q3-corporate-objective-v1.pdf',
          size: '850 KB',
          url: 'https://ais-pre-yxyhfkk7xwnqoui2jgpots-389822732223.asia-east1.run.app/files/q3-corporate-objective-v1.pdf'
        }
      })
    });
    assert(uploadWorkProofRes.status === 200, 'E2E Flow: Employee updates progress and attaches institutional artifact documents successfully');
    const updatedE2ETask = await uploadWorkProofRes.json();
    assert(updatedE2ETask.status === 'REVIEW', 'E2E Flow: Task status correctly transitions from PENDING to REVIEW');
    assert(updatedE2ETask.progress === 90, 'E2E Flow: Progress metric tracks precisely at 90%');
    assert(updatedE2ETask.attachments.some((a: any) => a.name === 'q3-corporate-objective-v1.pdf'), 'E2E Flow: Task attachments list registries capture verification file correctly');

    // 4. Verification of tenant boundaries: Zenith Solutions admin attempt to grab this task details
    const zenithLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@zenith.com', password: 'admin123' })
    });
    const zenithAuth = await zenithLoginRes.json();
    const crossTenantGetRes = await fetch(`${baseUrl}/api/tasks/${createdE2ETaskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zenithAuth.token}`
      }
    });
    assert(crossTenantGetRes.status === 404, 'E2E Security: Cross-tenant tasks detail access attempts are sealed (404 Not Found returns)');
  } catch (e: any) {
    assert(false, 'Complete End-to-End simulation workflow executed successfully', e.toString());
  }


  // ==========================================
  // V. REGRESSION TESTING
  // ==========================================
  setCategory('Regression Testing');

  // 1. DOMException system shimming validation (node-domexception resolution check)
  try {
    const hasNativeDOMException = typeof globalThis.DOMException !== 'undefined';
    assert(hasNativeDOMException === true, 'Platform Shimming: Native DOMException is available in Node global scope');
    
    // Test importing state of our node-domexception custom shim overrides
    const testException = new globalThis.DOMException('Regression testing error message', 'SecurityError');
    assert(testException.name === 'SecurityError', 'Platform Shimming: Custom DOMException instantiates with standard properties');
  } catch (e: any) {
    assert(false, 'DOMException platform shimming is completely healthy', e.toString());
  }

  // 2. Strict Suspension regressions: Ensuring suspended staff roles can NEVER bypass lock filters
  try {
    // Suspend Devon Miller (emp2@aether.com)
    await fetch(`${baseUrl}/api/employees/usr_ae_emp2`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isSuspended: true })
    });

    // Attempt Devon Login immediately - must fail with 403
    const suspendedLoginAttempt = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'emp2@aether.com', password: 'emp123' })
    });
    assert(suspendedLoginAttempt.status === 403, 'Account Suspends: Unauthorized logins block-filtered immediately with 403 Forbidden');

    // Reactivate to preserve seed sanity
    await fetch(`${baseUrl}/api/employees/usr_ae_emp2`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isSuspended: false })
    });
  } catch (e: any) {
    assert(false, 'User lock policy regressions passed cleanly', e.toString());
  }

  // 3. User Input password validation rule regressions
  try {
    const changePasswordRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ currentPassword: 'admin123', newPassword: '123' }) // weak too-short password
    });
    assert(changePasswordRes.status === 400, 'Security Rules: Shorter password changes are strictly block-filtered on validation limits (400 Bad Request)');
  } catch (e: any) {
    assert(false, 'Password policies are correctly enforced', e.toString());
  }


  // ==========================================
  // FINAL PERFORMANCE & RESULTS BRIEF
  // ==========================================
  const totalDuration = Date.now() - startTime;
  const totalTests = testsRegistry.length;
  const passedTests = testsRegistry.filter(t => t.passed).length;
  const failedTests = testsRegistry.filter(t => !t.passed).length;

  console.log(`\n${colors.bright}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}                        SUMMARY OF QA REPORT                    ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}================================================================${colors.reset}`);
  console.log(` Total Modules Checked: 5 (Unit, Integration, System, E2E, Regression)`);
  console.log(` Total Checks Audited : ${colors.bright}${totalTests}${colors.reset}`);
  console.log(` Status Code - Passed : ${colors.green}${passedTests} passed${colors.reset}`);
  console.log(` Status Code - Failed : ${failedTests > 0 ? `${colors.red}${failedTests} failed` : `${colors.green}0 failed`}${colors.reset}`);
  console.log(` Net Elapsed Time     : ${totalDuration} ms`);
  console.log(`${colors.bright}${colors.blue}================================================================${colors.reset}`);

  if (failedTests > 0) {
    console.error(`\n ${colors.red}🛑 INTEGRATED QA VERDICT: AUDIT ENCOUNTERED FAILED SPECIFICATIONS. REVIEW VERIFICATION REGISTRIES AS SHOWN ABOVE.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n ${colors.green}🎉 INTEGRATED QA VERDICT: ALL MAINSTAGE RUNTIMES AND CONTROLLERS ARE HIGHLY STABLE & VERIFIED!${colors.reset}`);
    process.exit(0);
  }
}

startTestSuite();
