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

- [ ] 🔄 **Phase 2: AI SDK Query Generation** (In Progress)
  - [x] `scripts/generate-queries-with-ai-sdk.ts` - Vercel AI SDK implementation
  - [x] Multi-provider support framework (OpenAI, Google Gemini, Ollama)
  - [x] Small sample testing (2 functions, 30 queries generated successfully)
  - [ ] Test with different AI providers (GPT-4o-mini ✅, Gemini, Ollama)
  - [ ] Full batch application (270 functions × 15 queries = 4,050 queries)
  - [ ] Cost-efficient provider selection

- [ ] ⏳ **Phase 3: Dataset Construction**
  - [ ] `scripts/build-benchmark-dataset.ts` - Dataset structuring
  - [ ] Train/Test/Validation splits
  - [ ] Quality validation of 4000+ queries

- [ ] ⏳ **Phase 4: Evaluation System**
  - [ ] `benchmarks/evaluate-selection.ts` - Evaluation metrics implementation
  - [ ] Accuracy, Top-K, MRR, NDCG calculations
  - [ ] Failure case analysis functionality

- [ ] ⏳ **Phase 5: Comparison Benchmarks**
  - [ ] `benchmarks/strategies/orama-bm25.ts` - Current implementation wrapper
  - [ ] `benchmarks/strategies/ai-selection.ts` - AI-based direct selection
  - [ ] `benchmarks/strategies/keyword-matching.ts` - Keyword matching
  - [ ] `benchmarks/run-comparison.ts` - All strategies comparison execution

- [ ] ⏳ **Phase 6: Report Generation**
  - [ ] `benchmarks/generate-report.ts` - Visualization and reporting
  - [ ] HTML format detailed reports
  - [ ] Automated improvement suggestions

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