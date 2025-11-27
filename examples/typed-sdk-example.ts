/**
 * Example usage of the typed StackOne SDK
 *
 * This demonstrates how to use the auto-generated typed SDK
 * to interact with the StackOne API with full TypeScript support.
 */

import {
  AtsClient,
  CrmClient,
  HrisClient,
  type StackOneClientConfig,
  type ats,
  // Access types via namespace
  type hris,
} from '../src/generated-sdk';

// Configure the client
const config: StackOneClientConfig = {
  apiKey: process.env.STACKONE_API_KEY || 'your-api-key',
  accountId: process.env.STACKONE_ACCOUNT_ID || 'your-account-id',
  // baseUrl: 'https://api.stackone.com', // optional, defaults to this
};

// Create clients for different APIs
const hrisClient = new HrisClient(config);
const atsClient = new AtsClient(config);
const _crmClient = new CrmClient(config);

async function main() {
  try {
    // ===== HRIS Examples =====

    // List employees with full type safety
    const employees: hris.EmployeesPaginated = await hrisClient.listEmployees({
      pageSize: '10',
      fields: 'id,first_name,last_name,email',
    });

    console.log('Employees:');
    for (const employee of employees.data) {
      // TypeScript knows all properties of Employee
      console.log(`- ${employee.first_name} ${employee.last_name} (${employee.id})`);
    }

    // Get a specific employee
    if (employees.data.length > 0) {
      const firstEmployee = employees.data[0];
      if (firstEmployee.id) {
        const employeeResult: hris.EmployeeResult = await hrisClient.getEmployee({
          id: firstEmployee.id,
        });
        console.log('\nEmployee details:', employeeResult.data);
      }
    }

    // List companies
    const companies: hris.CompaniesPaginated = await hrisClient.listCompanies();
    console.log('\nCompanies:');
    for (const company of companies.data) {
      console.log(`- ${company.name} (${company.id})`);
    }

    // ===== ATS Examples =====

    // List candidates
    const candidates: ats.CandidatesPaginated = await atsClient.listCandidates({
      pageSize: '10',
    });

    console.log('\nCandidates:');
    for (const candidate of candidates.data) {
      console.log(`- ${candidate.first_name} ${candidate.last_name}`);
    }

    // List jobs
    const jobs: ats.AtsJobsPaginated = await atsClient.listJobs();
    console.log('\nJobs:');
    for (const job of jobs.data) {
      console.log(`- ${job.title} (${job.id})`);
    }

    // ===== Pagination Example =====

    // Use cursor-based pagination
    let nextCursor: string | undefined;
    let page = 1;

    do {
      const pageResult = await hrisClient.listEmployees({
        pageSize: '25',
        next: nextCursor,
      });

      console.log(`\nPage ${page}: ${pageResult.data.length} employees`);
      nextCursor = pageResult.next ?? undefined;
      page++;
    } while (nextCursor && page <= 3); // Limit to 3 pages for example

    // ===== Filtering Example =====

    // Get employees updated after a specific date
    const recentEmployees = await hrisClient.listEmployees({
      filter: { updated_after: '2024-01-01T00:00:00.000Z' },
    });

    console.log(`\nRecently updated employees: ${recentEmployees.data.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
