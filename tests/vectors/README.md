# Shared test vectors

Unit-test data both SDKs load, so the Python and Node unit tests check the same inputs against
the same expected outputs. The harness in this repo grades an SDK end to end, over the wire;
these grade the pure functions underneath: reading a `Retry-After`, the backoff, header
filtering, argument encoding and account-id validation. They also fix the canonical wording of
every message the two SDKs share.

Every expected value was taken from both SDKs' behaviour at the time it was written, and only
where they agreed. Where they disagreed, the contract has since settled which is right, and the
case is in that file's `cases` array with the agreed value — a `description` on the case says what
changes. A case that is settled but still not identical across SDKs for a reason outside the rule
(for example, a JSON parser has already rounded a value before the rule ever sees it) is in a
`known_differences` array instead, not graded. A file keeps an `unresolved` array for a case the
SDKs disagree on today and the contract does not yet settle; none is open right now.

| File | Input → expected |
|---|---|
| `retry-after.json` | a `Retry-After` value and `now` → seconds before the cap, or `null` when absent or unreadable |
| `backoff.json` | retry number, injected random value, `Retry-After` → the delay; and a delay against the time left → `wait` or `return-429` |
| `header-values.json` | a nested header value → the string forwarded, or `{"dropped": true}` |
| `header-names.json` | a nested header name → `{"forwarded": "<trimmed>"}` or `{"dropped": "<reason>"}` |
| `header-arguments.json` | a served `inputSchema` and the model's arguments → the arguments sent, and the warnings as `{argument, header?, reason}` |
| `argument-encoding.json` | a tool's arguments → `ok`, or `{"error": "ToolArgumentsError", "reason"}` |
| `account-ids.json` | an account-id argument → `ok`, or each language's config error class |
| `messages.json` | the canonical template of every shared warning and error, with each SDK's current text beside it |

`schema/` holds a JSON Schema (draft 2020-12) for each file. Each file names its schema in
`$schema`.

## File shape

```jsonc
{
    "$schema": "./schema/<name>.schema.json",
    "description": "what the vectors are, and the context each case runs in",
    "version": 1,
    // any constants the cases share: max_delay_seconds, constants, reasons, error_classes
    "cases": [{ "id": "…", "description": "…", /* inputs */ "expected…": … }],
    // present only while a case is open:
    "unresolved": [{ "id": "…", "description": "…", /* inputs */ "python": …, "node": … }],
    // present only where a settled case still differs for a reason outside the rule:
    "known_differences": [{ "id": "…", "description": "…", /* inputs */ "python": …, "node": … }]
}
```

- **`id`** is unique within a file and does not change: a test names its cases by it.
- **`version`** is bumped when an existing case's meaning or expected value changes. Adding a case
  does not bump it. Versions count from the vectors' first release: every change made before it
  stays at version 1.
- **`unresolved`** cases are not graded. Each one says what the two SDKs do differently. Once the
  contract settles it, the case moves to `cases` with the agreed value, and the SDK that changes
  fixes its code in the same release. A file only has this array while it has an open case.
- **`known_differences`** cases are not graded either. Each one is a settled exception, recorded
  only in `known_differences` and not also in `cases`: the contract has chosen the behaviour, but
  the two SDKs still produce different values for a reason outside the rule being tested, so
  there is nothing to converge on. A file only has this array while it has such a case.

## Reading the values

- **Numbers JSON cannot hold.** `{"$number": "NaN"}`, `{"$number": "Infinity"}` and
  `{"$number": "-Infinity"}` stand for the non-finite floats. Decode them before use: walk the
  value, and replace every object whose only key is `$number` with the float it names.
- **Seconds** are compared with a relative tolerance of 1e-9. The Node SDK works in milliseconds,
  and converting back can leave a last-bit difference: 99999999999999999999 s round-trips as
  99999999999999980000.
- **`now` and `random` are injected.** `retry-after.json` gives each case its `now` in RFC 3339.
  `backoff.json` gives the uniform value in [0, 1) that the jitter is built from: Node's
  `Math.random()`, and in Python the value `random.uniform(0.5, 1.0)` scales (`0.5 + 0.5 * r`). An
  SDK whose clock or random source is not yet injectable has to make it injectable to load these.
- **Warnings** in `header-arguments.json` are listed in argument order, which both SDKs follow. A
  warning's `reason` is a code. `messages.json` turns a code into text (`reasons`) and fills it
  into a template, so the wording is checked once there and not in every case.
- **Error classes** are given by name. `account-ids.json` gives both, because the spelling differs:
  `ToolsetConfigError` in Python, `ToolSetConfigError` in Node.

## `messages.json`

Each message has an `id`, a `template` with named placeholders (`{endpoint}`, `{attempt}`, …), a
`format` for each placeholder, and the text each SDK emits today (`python`, `node`). `matches`
says whether that text is already the canonical one, and `notes` say where the text depends on
more than the template. Render
a template by replacing each placeholder with its value written in the placeholder's format:

| Format | Written as |
|---|---|
| `text` | the value as is |
| `json` | compact JSON: `JSON.stringify(v)` / `json.dumps(v, ensure_ascii=False, separators=(",", ":"))`, so a string comes out in double quotes |
| `integer` | decimal digits |
| `seconds` | a number of seconds, as JavaScript's `String(n)` writes it: `1`, `0.5`, never `1.0` |
| `seconds-2dp` | rounded half up to two decimals (`Math.floor(x * 100 + 0.5) / 100`), then as `seconds` |
| `json-type` | the value's JSON type: `object`, `array`, `string`, `number`, `boolean`, `null` |
| `reason` | the text `reasons` gives for the code |

A prefix that a language adds stays outside the template: Node's `[@stackone/ai] ` on every
`console.warn`, and Python's logger name. The harness checks the same templates end to end: a
scenario's `expect.warnings` and `expect.error.message` must render one, or the run refuses to
start.

`unshared` lists messages only one SDK emits. They are recorded so they are not forgotten. They
have no canonical form yet.

## How an SDK consumes them

An SDK vendors a copy of this directory. Its unit tests load the vendored copy and never fetch
these files over the network. The vendored copy is pinned to a commit of this repo: the one the
SDK's CI already uses to check out the conformance suite.

1. Copy `vectors/` into the SDK, for example to `tests/conformance_vectors/` (Python) or
   `src/__fixtures__/conformance-vectors/` (Node), from the commit you pin.
2. Add a test per file that iterates `cases` and checks each `id`. Skip `unresolved` and
   `known_differences`. Check `version` too, so that a bump fails the test until someone has read
   what changed.
3. In CI, check out this repo at the pinned commit, as the conformance job already does, and fail
   unless the vendored copy is **byte-identical** to it:

   ```yaml
   - name: Vendored vectors match the pinned sdk-conformance
     run: diff -r sdk/tests/conformance_vectors sdk-conformance/vectors
   ```

   An edit to the copy fails CI, and so does a pin that moved without a re-copy. Neither SDK can
   drift from the data the other one tests against.

To update, bump the pin, re-copy, and fix whatever the new vectors fail.

```python
# Python (pytest)
VECTORS = Path(__file__).parent / "conformance_vectors"
retry_after = json.loads((VECTORS / "retry-after.json").read_text())

@pytest.mark.parametrize("case", retry_after["cases"], ids=lambda case: case["id"])
def test_retry_after(case):
    ...
```

```typescript
// Node (vitest)
import retryAfter from './__fixtures__/conformance-vectors/retry-after.json';

describe.each(retryAfter.cases)('Retry-After $id', (testCase) => {
    it('reads as the agreed seconds', () => { /* … */ });
});
```
