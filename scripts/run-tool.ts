import { configureImplicitFeedback, LangsmithFeedbackClient } from '../src/feedback';
import { StackOneToolSet } from '../src/toolsets/stackone';

async function main() {
  const sessionId = `hris-feedback-${Date.now()}`;

  // Log when runs are pushed to LangSmith while preserving original behaviour.
  const originalLangSmithLog = LangsmithFeedbackClient.prototype.logToolCall;
  LangsmithFeedbackClient.prototype.logToolCall = async function (session, record) {
    console.log('[langsmith] logging run', { toolName: record.toolName, session });
    const runId = await originalLangSmithLog.call(this, session, record);
    console.log('[langsmith] run id', runId ?? 'none');
    return runId;
  };

  const manager = configureImplicitFeedback({
    enabled: true,
    langsmith: {
      enabled: true,
      projectName: process.env.LANGSMITH_PROJECT ?? 'stackone-implicit-feedback',
    },
  });

  const maskHeaders = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return value;
    }
    const clone: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    if ('Authorization' in clone) {
      clone.Authorization = '[redacted]';
    }
    if ('authorization' in clone) {
      clone.authorization = '[redacted]';
    }
    return clone;
  };

  const maskRequest = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return value;
    }
    const clone: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    if ('headers' in clone) {
      clone.headers = maskHeaders(clone.headers);
    }
    return clone;
  };

  console.log('[feedback] harness ready', { sessionId });
  console.log('LangSmith logging is enabled:', manager.isEnabled());

  const originalRecord = manager.recordToolCall.bind(manager);
  manager.recordToolCall = async (snapshot) => {
    console.log('[feedback] snapshot', {
      toolName: snapshot.toolName,
      success: snapshot.success,
      error: snapshot.error,
      startedAt: snapshot.startedAt,
      completedAt: snapshot.completedAt,
      executionTimeMs: snapshot.executionTime,
      sessionId: sessionId,
      summary: snapshot.resultSummary,
      context: snapshot.callContext,
    });
    return originalRecord(snapshot);
  };

  const toolset = new StackOneToolSet({ strict: true });
  const tools = toolset.getStackOneTools();

  const listEmployeesTool = tools.getStackOneTool('hris_list_employees');
  const getEmploymentTool = tools.getStackOneTool('hris_get_employment');

  console.log('Executing hris_list_employees dry run to inspect request shape...');
  const listEmployeesDry = await listEmployeesTool.execute({}, {
    dryRun: true,
    feedbackSessionId: sessionId,
  });
  console.log('Dry run request:', maskRequest(listEmployeesDry));

  console.log('Executing hris_list_employees live call to fetch the actual employee page...');
  const listEmployeesLive = await listEmployeesTool.execute({}, {
    feedbackSessionId: sessionId,
  });

  const employeesPage = Array.isArray((listEmployeesLive as any)?.data)
    ? (listEmployeesLive as any).data
    : Array.isArray(listEmployeesLive)
    ? (listEmployeesLive as any)
    : [];

  console.log('Employees page length:', employeesPage.length);
  if (employeesPage.length > 0) {
    const firstEmployee = employeesPage[0] as Record<string, unknown>;
    console.log('First employee summary:', {
      id: firstEmployee.id,
      name: firstEmployee.name,
      employmentCount: Array.isArray(firstEmployee.employments)
        ? firstEmployee.employments.length
        : undefined,
    });
  }

  let employmentId: string | undefined;

  for (const employee of employeesPage) {
    const employments = (employee as Record<string, any>).employments;
    if (Array.isArray(employments)) {
      const match = employments.find((item) => typeof item?.id === 'string' && item.id.length > 0);
      if (match) {
        employmentId = match.id;
        break;
      }
    }
  }

  if (!employmentId) {
    console.log('No employment id found on employees, retrieving via hris_list_employments to backfill...');
    const listEmploymentsTool = tools.getStackOneTool('hris_list_employments');
    const employmentsLive = await listEmploymentsTool.execute({}, { feedbackSessionId: sessionId });
    const employmentsData = Array.isArray((employmentsLive as any)?.data)
      ? (employmentsLive as any).data
      : Array.isArray(employmentsLive)
      ? (employmentsLive as any)
      : [];
    employmentId = employmentsData.find((item: Record<string, unknown>) =>
      typeof item?.id === 'string'
    )?.id as string | undefined;
    console.log('Selected employment id:', employmentId ?? 'none');
  }

  if (!employmentId) {
    throw new Error('Unable to determine an employment id to fetch');
  }

  console.log('Executing hris_get_employment dry run to review the request headers...');
  const getEmploymentDry = await getEmploymentTool.execute(
    { id: employmentId },
    { dryRun: true, feedbackSessionId: sessionId }
  );
  console.log('Dry run request:', maskRequest(getEmploymentDry));

  console.log('Executing hris_get_employment live call to inspect a specific employment...');
  const employment = await getEmploymentTool.execute(
    { id: employmentId },
    { feedbackSessionId: sessionId }
  );

  console.log('Employment summary:', {
    id: (employment as any)?.data?.id ?? (employment as any)?.id,
    employeeId: (employment as any)?.data?.employee_id ?? (employment as any)?.employee_id,
    jobTitle: (employment as any)?.data?.job_title ?? (employment as any)?.job_title,
    effectiveDate: (employment as any)?.data?.effective_date ?? (employment as any)?.effective_date,
  });

  configureImplicitFeedback({ enabled: false, langsmith: { enabled: false } });
}

main().catch((error) => {
  console.error('Failed to execute tool:', error);
  process.exitCode = 1;
});
