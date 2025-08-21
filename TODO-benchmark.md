# Tool Selection Benchmark System TODO

## Progress Status

- [x] ✅ **Research & Planning Phase Complete**
  - Understanding meta-tools architecture
  - Investigation of existing test patterns 
  - AI SDK integration feasibility confirmed

- [x] ✅ **Phase 1: Endpoint Extraction & Catalog Creation** (Complete)
  - [x] `scripts/extract-endpoints.ts` - Extract function info from all OpenAPI specs
  - [x] `data/functions-catalog.json` - Generate catalog of 270 functions
  - [x] Function metadata analysis (categories, actions, entities, etc.)
  
  **Extraction Results:**
  - Total 270 functions extracted
  - 11 categories (hris: 72, ats: 72, marketing: 26, lms: 24, ticketing: 19, ...)
  - Action distribution: list(100), get(97), create(25), update(22), ...
  - Complexity distribution: Simple(33), Medium(48), Complex(189)

- [x] ✅ **Phase 2: AI SDK Query Generation** (Complete)
  - [x] `scripts/generate-queries-with-ai-sdk.ts` - Vercel AI SDK implementation
  - [x] Multi-provider support framework (OpenAI, Google Gemini, Ollama)
  - [x] Small sample testing (2 functions, 30 queries generated successfully)
  - [x] Test with different AI providers (GPT-4o-mini ✅, Gemma3:4b ✅, Gemma3:270m ✅)
  - [x] Cost-efficient provider selection (Ollama local models)
  - [x] Generated 257 test cases from 12 functions across multiple models

- [x] ✅ **Phase 3: Dataset Construction** (Complete)
  - [x] `scripts/build-benchmark-dataset.ts` - Dataset structuring
  - [x] Train/Test/Validation splits (189/30/38 cases)
  - [x] Quality validation and statistics generation
  - [x] Multiple output formats (full dataset + individual split files)
  
  **Dataset Results:**
  - 257 test cases from 12 unique functions
  - Categories: stackone(107), crm(150)
  - Difficulty: easy(119), medium(81), hard(41)
  - Models: GPT-4o-mini, Gemma3:4b, Gemma3:270m

- [x] ✅ **Phase 4: Evaluation System** (Complete)
  - [x] `benchmarks/evaluate-selection.ts` - Comprehensive evaluation metrics
  - [x] Accuracy, Top-K, MRR, NDCG calculations
  - [x] Failure case analysis and detailed breakdowns
  - [x] Category and difficulty-wise performance analysis

- [x] ✅ **Phase 5: Comparison Benchmarks** (Complete)
  - [x] `benchmarks/strategies/base-strategy.ts` - Modular strategy interface
  - [x] `benchmarks/strategies/orama-strategy.ts` - Current Orama BM25 implementation
  - [x] `benchmarks/strategies/ai-strategy.ts` - AI-based direct selection (multi-model)
  - [x] `benchmarks/strategies/keyword-strategy.ts` - Keyword matching baseline
  - [x] `benchmarks/run-comparison.ts` - Multi-strategy comparison framework

- [x] ✅ **Phase 6: Report Generation** (Complete)
  - [x] `benchmarks/generate-report.ts` - Interactive HTML report generation
  - [x] Chart.js integration for visualizations
  - [x] Responsive design with performance charts
  - [x] Winner analysis and improvement insights

## Target Function
```
f(user_query, function_group) = appropriate_function
```

## Evaluation Metrics
- Accuracy (exact match rate)
- Top-K Accuracy (precision at K)
- MRR (Mean Reciprocal Rank)
- NDCG (Normalized Discounted Cumulative Gain)
- Category-wise and difficulty-wise accuracy
- Confusion matrix for detailed analysis

## NPM Scripts (Planned)
```json
{
  "extract:endpoints": "bun run scripts/extract-endpoints.ts",
  "generate:queries": "bun run scripts/generate-queries-with-ai-sdk.ts", 
  "dataset:build": "bun run scripts/build-benchmark-dataset.ts",
  "benchmark:evaluate": "bun run benchmarks/evaluate-selection.ts",
  "benchmark:compare": "bun run benchmarks/run-comparison.ts",
  "benchmark:report": "bun run benchmarks/generate-report.ts"
}
```

## Next Action
Currently working on AI SDK query generation - testing complete, ready for batch processing