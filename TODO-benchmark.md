# ベンチマークシステム構築 TODO

## 進行状況

- [x] ✅ **研究・計画フェーズ完了**
  - Meta-toolsアーキテクチャの理解
  - 既存テストパターンの調査 
  - Gemini CLI利用可能性確認

- [x] ✅ **Phase 1: エンドポイント抽出とカタログ作成** (完了)
  - [x] `scripts/extract-endpoints.ts` - 全OpenAPIスペックから関数情報を抽出
  - [x] `data/functions-catalog.json` - 270関数のカタログファイル生成
  - [x] 関数のメタデータ分析（カテゴリ、アクション、エンティティ等）
  
  **抽出結果:**
  - 合計270関数を抽出
  - 11カテゴリ (hris: 72, ats: 72, marketing: 26, lms: 24, ticketing: 19, ...)
  - アクション分布: list(100), get(97), create(25), update(22), ...
  - 複雑度分布: Simple(33), Medium(48), Complex(189)

- [ ] ⏳ **Phase 2: Gemini CLIでクエリ生成**
  - [ ] `scripts/generate-queries-with-gemini.ts` - 単一関数用クエリ生成
  - [ ] `scripts/batch-generate-dataset.ts` - 全関数への一括適用
  - [ ] 各関数につき15種類の多様なクエリ生成

- [ ] ⏳ **Phase 3: データセット構築**
  - [ ] `scripts/build-benchmark-dataset.ts` - データセット構造化
  - [ ] Train/Test/Validation分割
  - [ ] 4000+クエリの品質検証

- [ ] ⏳ **Phase 4: 評価システム**
  - [ ] `benchmarks/evaluate-selection.ts` - 評価メトリクス実装
  - [ ] Accuracy, Top-K, MRR, NDCG計算
  - [ ] 失敗ケース分析機能

- [ ] ⏳ **Phase 5: 比較ベンチマーク**
  - [ ] `benchmarks/strategies/orama-bm25.ts` - 現在実装のラップ
  - [ ] `benchmarks/strategies/gemini-selection.ts` - Gemini直接選択
  - [ ] `benchmarks/strategies/keyword-matching.ts` - キーワードマッチング
  - [ ] `benchmarks/run-comparison.ts` - 全戦略比較実行

- [ ] ⏳ **Phase 6: レポート生成**
  - [ ] `benchmarks/generate-report.ts` - 可視化とレポート
  - [ ] HTML形式の詳細レポート
  - [ ] 改善提案の自動生成

## 目標関数
```
f(user_query, function_group) = appropriate_function
```

## 評価メトリクス
- Accuracy (完全一致率)
- Top-K Accuracy (Top-K精度)
- MRR (Mean Reciprocal Rank)
- NDCG (Normalized Discounted Cumulative Gain)
- カテゴリ別・難易度別精度
- 混同行列による詳細分析

## NPMスクリプト (予定)
```json
{
  "extract:endpoints": "bun run scripts/extract-endpoints.ts",
  "generate:queries": "bun run scripts/generate-queries-with-gemini.ts", 
  "dataset:build": "bun run scripts/build-benchmark-dataset.ts",
  "benchmark:evaluate": "bun run benchmarks/evaluate-selection.ts",
  "benchmark:compare": "bun run benchmarks/run-comparison.ts",
  "benchmark:report": "bun run benchmarks/generate-report.ts"
}
```

## 次のアクション
現在 `scripts/extract-endpoints.ts` の実装から開始中