# Migrating from 2.x to 3.0

3.0 is a thin client over StackOne's MCP endpoint. Every tool call goes over MCP `tools/call`, and the only other request the SDK makes is `GET /accounts`, to find your linked accounts. Search runs on the server. Anything MCP does not support has been removed rather than kept on a second transport.

Work through the sections that apply to you. Each one gives the 2.x code and its 3.0 replacement.

- [Installation](#installation)
- [Removed exports](#removed-exports)
- [Constructor options](#constructor-options)
- [Search and execute](#search-and-execute)
- [Results](#results)
- [Tool arguments and headers](#tool-arguments-and-headers)
- [Accounts](#accounts)
- [Feedback](#feedback)
- [Errors](#errors)
- [Schemas given to a model](#schemas-given-to-a-model)
- [Hand-built tools and `ExecuteConfig`](#hand-built-tools-and-executeconfig)

## Installation

`zod` is no longer a peer dependency, and `@orama/orama` and `defu` are no longer dependencies. Nothing else changes.

```bash
# 2.x
npm install @stackone/ai zod

# 3.0
npm install @stackone/ai
```

## Removed exports

These names are no longer exported from `@stackone/ai`:

| Removed                                                                                                                  | Use instead                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `SearchTool`, `SearchMode`, `SearchConfig`, `SearchToolsOptions`, `SearchActionNamesOptions`                             | `toolset.search()`. See [Search and execute](#search-and-execute)                            |
| `SemanticSearchClient`, `SemanticSearchError`, `SemanticSearchOptions`, `SemanticSearchResponse`, `SemanticSearchResult` | `toolset.search()`, which returns `SearchResult` objects                                     |
| `createFeedbackTool`                                                                                                     | `toolset.submitFeedback()`. See [Feedback](#feedback)                                        |
| `DefenderConfig`, `DefenderMode`, `DEFAULT_DEFENDER_CONFIG`                                                              | Defender settings in the StackOne dashboard. See [Constructor options](#constructor-options) |
| `BinaryDownloadResult`, `isBinaryDownloadResult`                                                                         | The download link in the result. See [Results](#results)                                     |
| `AuthenticationConfig`, `BaseToolSetConfig`                                                                              | `StackOneToolSetConfig`, with `apiKey`                                                       |
| `ParameterLocation`                                                                                                      | Nothing. The server maps arguments onto the request                                          |

`ToolSetError`, `ToolSetConfigError` and `ToolSetLoadError` are still exported from the package root.

## Constructor options

**An API key is required.** 2.x warned and carried on without one; 3.0 throws `ToolSetConfigError`. The `strict` option, which made 2.x throw, is gone.

**`authentication`, `rpcClient`, `search`, `strict` and `defender` are removed.** Pass the key as `apiKey` (or set `STACKONE_API_KEY`), and configure Defender per project in the StackOne dashboard. The `defenderMode` getter is gone with the option.

```typescript
// 2.x
const toolset = new StackOneToolSet({
	authentication: { type: 'basic', credentials: { username: apiKey } },
	search: { method: 'auto' },
	defender: { ...DEFAULT_DEFENDER_CONFIG, blockHighRisk: true },
});

// 3.0
const toolset = new StackOneToolSet({ apiKey });
```

**`Authorization`, `x-account-id` and `User-Agent` in `headers` are ignored**, with a warning. The SDK always sets them itself, so a `headers` option can no longer replace the credential or point requests at another account. Use `apiKey` and `accountId` / `accountIds` instead. Any other header is still sent with every request.

```typescript
// 2.x: this header replaced the Basic credential
new StackOneToolSet({ headers: { Authorization: `Bearer ${token}`, 'x-account-id': 'acc-1' } });

// 3.0
new StackOneToolSet({ apiKey, accountId: 'acc-1' });
```

## Search and execute

Client-side search is gone: the local BM25/TF-IDF index, the semantic search client, the `search` constructor option, and the `tool_search` / `tool_execute` meta tools. The server's `*_search_actions` tool now does the search, and `toolset.execute()` runs an action by id through the server's `*_execute_action` tool.

```typescript
// 2.x
const toolset = new StackOneToolSet({ search: { method: 'auto' } });
const tools = await toolset.searchTools('list employees', { topK: 5 });
const result = await tools.toArray()[0]?.execute({ query_page_size: 25 });

const names = await toolset.searchActionNames('time off requests', { topK: 5 });

// 3.0
const toolset = new StackOneToolSet();
const [hit] = await toolset.search('list employees', { topK: 5 }); // at most 5, best first
if (!hit) throw new Error('No action matched');
const result = await toolset.execute(
	hit.action_id,
	{ query: { page_size: 25 } }, // the nested form hit.input_schema describes
	{ accountIds: [hit.account_id], sessionId: hit.session_id },
);
```

`searchTools()`, `searchActionNames()`, `getSearchTool()`, `getSearchConfig()` and `getTools()` are removed. `search()` returns plain objects carrying `action_id` and the `account_id` that found it, plus `description`, `similarity_score`, `input_schema`, `example_request` and `session_id` when the server sends them. `topK` caps the whole result, as in 2.x, after ranking across every connector; the same action linked on two accounts is two hits. When an action's connector is linked on more than one account, `execute()` throws `ToolSetConfigError` unless `accountIds` picks one, such as `[hit.account_id]`. `execute()` raises rather than returning `{ error }`: `ToolSetConfigError` before any request when `actionId`, `args` or `sessionId` is malformed, `ToolArgumentsError` when the arguments cannot be encoded as JSON (NaN or Infinity, a `Date`, a circular reference, for example), `ToolSetLoadError` when no linked connector serves the action, and `StackOneAPIError` when the action fails, including when the server rejects the arguments.

To give a model the search and execute tools, set the tool mode on the toolset. `openai()` no longer takes `mode`.

```typescript
// 2.x
const toolset = new StackOneToolSet({ search: {} });
const openAITools = await toolset.openai({ mode: 'search_and_execute' });

// 3.0: two tools per connector, served by the server
const toolset = new StackOneToolSet({ toolMode: 'search_execute' });
const tools = await toolset.fetchTools();
const openAITools = tools.toOpenAI();
// ...then run the model's tool calls and get the messages to send back:
messages.push(message, ...(await tools.executeOpenAIToolCalls(message.tool_calls)));
```

## Results

**Every tool returns the server's result as the server wrote it.** For an action, that is `{ isError: false, result, defenderMetadata?, policyMetadata? }`, exported as the `ActionResult` type. Search results are bare JSON. This applies to `tool.execute()` and `toolset.execute()` alike.

`toolset.execute()` and `submitFeedback()` are typed as returning `ActionResult`. `tool.execute()` still returns `JsonObject`, because a tool can be a `*_search_actions` meta tool or a `dryRun`: on an action tool, assert `ActionResult`. Either way `result` is the action's own JSON, typed `JsonValue`, so narrow it to read inside it.

```typescript
import type { ActionResult, JsonObject } from '@stackone/ai';

const tool = (await toolset.fetchTools()).getTool('hibob_list_employees');
if (!tool) throw new Error('hibob_list_employees is not served');

// 2.x
const employees = (await tool.execute({})).data;

// 3.0
const { result } = (await tool.execute({})) as ActionResult;
const employees = (result as JsonObject).data;
```

A result with `isError` set raises `StackOneAPIError`, with the status from its payload in `statusCode` and the payload in `responseBody`.

**File actions return a download link, not bytes.** The SDK does not follow the link. When no link can be issued, the call raises `StackOneAPIError` with `statusCode` 501.

```typescript
// 2.x
const result = await download.execute({ id: 'file-id' });
if (isBinaryDownloadResult(result)) {
	writeFileSync(result.fileName ?? 'download.bin', result.content);
}

// 3.0
const { result } = (await download.execute({ id: 'file-id' })) as ActionResult;
const link = result as {
	download_url: string;
	expires_at: string;
	file: { name?: string; content_type?: string; content_length?: number };
};
const name = path.basename(link.file.name ?? 'download.bin'); // chosen by the provider: keep only the basename
writeFileSync(name, Buffer.from(await (await fetch(link.download_url)).arrayBuffer()));
```

**`dryRun` describes the `tools/call`**, not an HTTP request:

```typescript
await tool.execute({ id: '1' }, { dryRun: true });
// 2.x: { url: '.../actions/rpc', method: 'POST', headers, body, mappedParams }
// 3.0: { url: '.../mcp', method: 'tools/call', name: 'hibob_get_employee', arguments: { id: '1' } }
```

## Tool arguments and headers

**Arguments are sent as given**, as `tools/call` arguments, except header arguments: each is forwarded only if the tool's schema declares it, and `Authorization`, `x-account-id` and `User-Agent` never are (see below). The SDK no longer splits flat `path_` / `query_` / `body_` keys into an `/actions/rpc` envelope; the server maps them itself.

**Non-header arguments must be JSON values.** `null`, booleans, finite numbers, strings, arrays and plain objects are accepted; a `NaN` or `Infinity`, a `bigint`, a `Date`, `Map`, `Set` or `RegExp`, a function, a symbol, a class instance, a typed array or buffer, or a circular reference, anywhere in a non-header argument, throws `ToolArgumentsError` naming the path. 2.x let some of these through `JSON.stringify` silently converted (a `Date` to a string, a `Map` to `{}`), which sent the model a value it never supplied. An object property set to `undefined` is still treated as absent; `undefined` inside an array now throws, where 2.x sent it as `null`. Header arguments follow different rules — see "Header arguments are allowlisted" below.

**Integers outside the safe range are not sent exactly.** JavaScript's `number` type only represents integers exactly up to `Number.MAX_SAFE_INTEGER` (2^53 − 1); beyond that, a value may already be rounded by the time it reaches the SDK, where Python's arbitrary-precision integers reach the server exactly. Pass such integers as strings if you need the exact value preserved.

**`fetchTools()` tools have the server's own argument shape.** 2.x asked the server for the flat, prefixed style (`?param-style=flat_prefixed`). That request is gone, so the argument names are whatever the server serves for your project. Read them from `tool.parameters.properties` rather than hard-coding them:

```typescript
// 2.x
await tool.execute({ body_variables: { first: 25 } });

// 3.0: use the keys the schema names, for example
console.log(tool.parameters.properties);
await tool.execute({ body: { variables: { first: 25 } } });
```

**Header arguments are allowlisted.** A header argument is an entry of a `headers` object argument, or a top-level `headers_<name>` argument. Each one is forwarded only if the tool's schema declares it in the same form: under `headers.properties`, or as a `headers_<name>` property. An open `headers` object — `type: "object"`, no `properties`, and `additionalProperties` not `false` — declares every name; without `type: "object"`, or with `additionalProperties: false` and no `properties`, it declares none. `Authorization`, `x-account-id` and `User-Agent` are never forwarded, even when declared, because the SDK sets them itself. Anything dropped is logged as a warning. Every other argument is sent unchanged.

A top-level `headers` argument skips header filtering when the schema declares `headers` itself as a non-object field — it's an ordinary argument that happens to be named `headers`, so it is sent as given, subject to the same JSON-value check as every other argument. Otherwise, a `headers` argument that isn't a plain object is dropped with a warning. A `headers_<name>` argument is dropped with a warning when its value is an array or object.

`*_execute_action` serves an open `headers` object, so `toolset.execute()` passes your own headers on to the action, with the exception of those three:

```typescript
await toolset.execute('linear_list_comments', { headers: { 'x-request-id': 'abc' } });
```

## Accounts

**With no account id, the SDK discovers your accounts.** In 2.x, calling `fetchTools()` with no account listed tools without an `x-account-id`, which the API refuses. In 3.0 it asks `GET /accounts` (also available as `toolset.fetchAccounts()`) and lists the catalog of every active account. If you have many accounts, pass `accountId`, `accountIds` or call `setAccounts()` so the SDK does not fetch every catalog.

**`STACKONE_ACCOUNT_ID` is no longer read.** Pass the account id as `accountId` or `accountIds`. Since an unset account now means every active account, an environment variable that set it implicitly could widen or narrow a toolset's scope without the code saying so. `STACKONE_API_KEY` is still read. A toolset constructed with no account while `STACKONE_ACCOUNT_ID` is set to a non-empty value warns that it is ignored. To keep the variable, read it yourself; unset, it is `undefined` and the toolset discovers your accounts:

```typescript
// 2.x: STACKONE_ACCOUNT_ID picked up implicitly
const toolset = new StackOneToolSet();

// 3.0: `|| undefined`, so a variable that is set but empty means "discover", not an error
const toolset = new StackOneToolSet({ accountId: process.env.STACKONE_ACCOUNT_ID || undefined });
```

**An empty account id throws.** `accountId: ''`, or an empty string in `accountIds`, `execute.accountIds`, `setAccounts()` or a call's `accountIds`, now throws `ToolSetConfigError`. In 2.x an empty `accountId` fell back to `STACKONE_ACCOUNT_ID` or discovery; in 3.0 that would silently widen the toolset to every active account. So `accountId: process.env.STACKONE_ACCOUNT_ID` throws when the variable is set but empty (`STACKONE_ACCOUNT_ID=` in a `.env` file, for example): pass `process.env.STACKONE_ACCOUNT_ID || undefined`, as above.

**Listings are merged in sorted account order.** When two accounts serve the same tool name, `getTool()` returns the first one listed — now the one on the lowest account id, where 2.x followed the order you passed — and so do `executeOpenAIToolCalls()` and every adapter (`toOpenAI()`, `toAISDK()`, `toClaudeAgentSdk()` and the rest), which build one tool per name. A warning names the clashing tools. Pass `accountIds` to choose the account yourself.

**`fetchTools()` returns fresh tool instances on every call**, never the cached `Tools`, so `setAccountId()` on one tool no longer changes what later callers get. In a multi-account scope, an account whose listing fails with anything other than a 429 is skipped with a warning: the healthy accounts' listings are cached, and the failed account is retried after 30 seconds. A 429 that outlasts its retries instead rejects the whole call, since a rate limit on one account is likely to hit the others too. A single-account call throws its failure rather than skipping it, since there is no other account's catalog to fall back to.

## Feedback

The client-side `tool_feedback` tool and `createFeedbackTool()` have been removed, and `fetchTools()` no longer appends a feedback tool of its own.

```typescript
// 2.x
const feedbackTool = (await toolset.fetchTools()).getTool('tool_feedback');
await feedbackTool.execute({
	feedback: 'Worked well',
	account_id: 'acc_123',
	tool_names: ['workday_list_workers'],
});

// 3.0
const [hit] = await toolset.search('list workers');
if (!hit) throw new Error('No action matched');
await toolset.execute(hit.action_id, {}, { sessionId: hit.session_id });
await toolset.submitFeedback({
	rating: 'positive',
	toolNames: [hit.action_id],
	feedback: 'Worked well',
	sessionId: hit.session_id,
});
```

When feedback is enabled for your project, the server also serves a `stackone_submit_feedback` tool. **`fetchTools()` and `openai()` include it**, once, however many accounts are linked. If you don't want a model to call it, filter it out:

```typescript
const tools = (await toolset.fetchTools()).filter(
	(tool) => tool.name !== 'stackone_submit_feedback',
);
```

`submitFeedback()` throws `ToolSetLoadError` when feedback is not enabled. It calls the tool once, on the lowest account id in scope, and sends `actionRunId` as `action_run_id` when given.

## Errors

**Every error the SDK throws is a `StackOneError`.** `ToolSetError`, `ToolSetConfigError` and `ToolSetLoadError` extended `Error` in 2.x; they now extend `StackOneError`, alongside `StackOneAPIError` and the new `ToolArgumentsError` (thrown when a tool's arguments are not a JSON object, or cannot be encoded as JSON — see [Tool arguments and headers](#tool-arguments-and-headers)). If you tell them apart with `instanceof`, check the toolset errors first:

```typescript
try {
	await toolset.fetchTools();
} catch (error) {
	if (error instanceof ToolSetError) {
		// configuration or loading — test this first: it is also a StackOneError now
	} else if (error instanceof StackOneError) {
		// the API refused the request
	}
}
```

**`StackOneAPIError` keeps the message it is given.** 2.x appended the response body's `message` to it (`Request failed: path.id is missing`). Read the server's explanation from `error.responseBody` instead; the SDK's own messages already include it.

```typescript
// 2.x
new StackOneAPIError('Request failed', 400, { message: 'path.id is missing' }).message;
// 'Request failed: path.id is missing'

// 3.0
new StackOneAPIError('Request failed', 400, { message: 'path.id is missing' }).message;
// 'Request failed'
```

## Schemas given to a model

**`toJsonSchema()` passes the served schema through**: root keywords such as `$schema`, `$defs`, `title` and `additionalProperties` reach the model as the server served them, and `required` is the served list, left out when it is missing or empty. `toOpenAI()`, `toAnthropic()`, `toOpenAIResponses()`, `toAISDK()` and `toClaudeAgentSdkTool()` fold a top-level `oneOf` / `anyOf` / `allOf`, which those APIs reject, into the root.

## Hand-built tools and `ExecuteConfig`

**`BaseTool` no longer makes HTTP requests.** Its `execute()` throws unless a subclass overrides it, `RequestBuilder` is gone, and `ExecuteConfig` is `{ kind: 'mcp', … }` or `{ kind: 'local', … }` — the `http` and `rpc` kinds are removed. Tools from `fetchTools()` execute over MCP.

```typescript
// 2.x
const tool = new BaseTool(
	'get_employee',
	'Get an employee',
	{ type: 'object', properties: { id: { type: 'string' } } },
	{
		kind: 'http',
		method: 'GET',
		url: 'https://api.example.com/employees/{id}',
		bodyType: 'json',
		params: [{ name: 'id', location: 'path', type: 'string' }],
	},
	{ Authorization: `Bearer ${token}` },
);

// 3.0
class GetEmployee extends BaseTool {
	override async execute(input?: JsonObject | string): Promise<JsonObject> {
		const { id } = typeof input === 'string' ? JSON.parse(input) : (input ?? {});
		const response = await fetch(`https://api.example.com/employees/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.json();
	}
}
const tool = new GetEmployee(
	'get_employee',
	'Get an employee',
	{ type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
	{ kind: 'local' },
);
```

**Tools no longer carry headers.** The `headers` constructor argument, `getHeaders()` and `setHeaders()` are removed from `BaseTool`, and `ToolExecution` — the `execution` metadata `toAISDK()` can attach — no longer has `headers`, so it cannot leak the credential. `StackOneTool`'s fifth constructor argument is now the account id; use `getAccountId()` / `setAccountId()` to read or rebind it.

**`BaseTool#connector` and `Tools#getConnectors()` are removed.** Filter by provider with `fetchTools({ providers })`. A provider name can contain `_` (`browser_linkedin`), so do not split the tool name to find it:

```typescript
// 2.x
const hibobTools = tools.toArray().filter((tool) => tool.connector === 'hibob');

// 3.0
const hibobTools = await toolset.fetchTools({ providers: ['hibob'] });
```
