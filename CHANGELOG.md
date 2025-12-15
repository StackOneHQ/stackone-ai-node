# Changelog

## [2.0.7](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.6...v2.0.7) (2025-12-15)


### Bug Fixes

* **ci:** pack ([#244](https://github.com/StackOneHQ/stackone-ai-node/issues/244)) ([21c4a45](https://github.com/StackOneHQ/stackone-ai-node/commit/21c4a452af692bd7a6933453a1c4932ee34489d2))

## [2.0.6](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.5...v2.0.6) (2025-12-15)


### Bug Fixes

* **ci:** remove --provenance ([#242](https://github.com/StackOneHQ/stackone-ai-node/issues/242)) ([86f18bf](https://github.com/StackOneHQ/stackone-ai-node/commit/86f18bfd08c5ac02c64783506f75c39a2c5c0816))

## [2.0.5](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.4...v2.0.5) (2025-12-15)


### Bug Fixes

* **ci:** move install to nix action ([#240](https://github.com/StackOneHQ/stackone-ai-node/issues/240)) ([fe729aa](https://github.com/StackOneHQ/stackone-ai-node/commit/fe729aa6a938a845b321739384ee1bc4e9d090f4))

## [2.0.4](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.3...v2.0.4) (2025-12-15)


### Bug Fixes

* **ci:** latest -&gt; lts ([#238](https://github.com/StackOneHQ/stackone-ai-node/issues/238)) ([2485a97](https://github.com/StackOneHQ/stackone-ai-node/commit/2485a97222182d507433f4a916370dc51fb98923))

## [2.0.3](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.2...v2.0.3) (2025-12-15)


### Bug Fixes

* **release:** enable provence ([#236](https://github.com/StackOneHQ/stackone-ai-node/issues/236)) ([a784cd4](https://github.com/StackOneHQ/stackone-ai-node/commit/a784cd459d13a03daa791e363f56eaeebe43398a))

## [2.0.2](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.1...v2.0.2) (2025-12-15)


### Bug Fixes

* **release:** give permission to create id for publishing ([#234](https://github.com/StackOneHQ/stackone-ai-node/issues/234)) ([dd5b894](https://github.com/StackOneHQ/stackone-ai-node/commit/dd5b894352fc9d2ec45834537c243907404063f4))

## [2.0.1](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.0...v2.0.1) (2025-12-15)


### Bug Fixes

* ignore changelog from oxfmt ([#232](https://github.com/StackOneHQ/stackone-ai-node/issues/232)) ([8ae4480](https://github.com/StackOneHQ/stackone-ai-node/commit/8ae4480306aa132334b2e3e8e4c33003285bab3d))

## [2.0.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v2.0.0...v2.0.0) (2025-12-15)


### ⚠ BREAKING CHANGES

* Remove unused public exports from the SDK
* remove unified API integration and migrate to connector-based naming ([#219](https://github.com/StackOneHQ/stackone-ai-node/issues/219))
* **lint:** Linting rules are now significantly stricter. Code that previously passed Biome's checks may now fail with oxlint's pedantic, correctness, suspicious, performance, and style rule categories all set to error level.
* resolve typecheck errors by upgrading to zod v4 and ai SDK 5.0.108 ([#183](https://github.com/StackOneHQ/stackone-ai-node/issues/183))
* BaseToolSetConfig.stackOneClient is now rpcClient
* bun -> pnpm+vitest && manage deps with flake.nix ([#143](https://github.com/StackOneHQ/stackone-ai-node/issues/143))
* OpenAPI spec imports from src/openapi/ are removed
* **desp:** update openai sdk to v6 and deprecate v4 ([#120](https://github.com/StackOneHQ/stackone-ai-node/issues/120))
* metaRelevantTools() renamed to metaTools() and now returns Promise<Tools>

### Features

* add Anthropic Claude integration ([#208](https://github.com/StackOneHQ/stackone-ai-node/issues/208)) ([08e7ae0](https://github.com/StackOneHQ/stackone-ai-node/commit/08e7ae0450e40f27947619124e00672509af4187))
* add knip for unused code detection ([#174](https://github.com/StackOneHQ/stackone-ai-node/issues/174)) ([9df963d](https://github.com/StackOneHQ/stackone-ai-node/commit/9df963da3582712997564611ef170b78f5e5b6e4))
* add meta tools for dynamic tool discovery and execution ([#84](https://github.com/StackOneHQ/stackone-ai-node/issues/84)) ([e1da427](https://github.com/StackOneHQ/stackone-ai-node/commit/e1da4276a5b00028fdfa6341a4c4d0898d187f88))
* add pkg.pr.new ci ([#58](https://github.com/StackOneHQ/stackone-ai-node/issues/58)) ([4757773](https://github.com/StackOneHQ/stackone-ai-node/commit/4757773d238ea18427c520e83000813f9b376d62))
* add provider and action filtering to fetchTools() ([#124](https://github.com/StackOneHQ/stackone-ai-node/issues/124)) ([71fe4a4](https://github.com/StackOneHQ/stackone-ai-node/commit/71fe4a476e9e07e1348381b9926bacdbb986549f))
* add test coverage reporting with GitHub Pages deployment ([#188](https://github.com/StackOneHQ/stackone-ai-node/issues/188)) ([02a572e](https://github.com/StackOneHQ/stackone-ai-node/commit/02a572ede612db5e26b5f6c510c1b57a84ca050a))
* breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
* build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
* check pr title ([#45](https://github.com/StackOneHQ/stackone-ai-node/issues/45)) ([56ce286](https://github.com/StackOneHQ/stackone-ai-node/commit/56ce2867bb2db3c7550eb083f06c8881f9ca85c6))
* error from tools ([#31](https://github.com/StackOneHQ/stackone-ai-node/issues/31)) ([96e6745](https://github.com/StackOneHQ/stackone-ai-node/commit/96e6745da689da313658c881a2e144c238f85274))
* **example:** add interactive CLI demo with @clack/prompts ([#203](https://github.com/StackOneHQ/stackone-ai-node/issues/203)) ([c5c6990](https://github.com/StackOneHQ/stackone-ai-node/commit/c5c699012b4e7260cb799a4fa7e2625bc69dc769))
* **examples:** add TanStack AI and Claude Agent SDK integrations with E2E tests ([#222](https://github.com/StackOneHQ/stackone-ai-node/issues/222)) ([e890de1](https://github.com/StackOneHQ/stackone-ai-node/commit/e890de13e7e59abc77a3c66a441fe3715df5ca2a))
* experimental doc handling ([#50](https://github.com/StackOneHQ/stackone-ai-node/issues/50)) ([366f3ca](https://github.com/StackOneHQ/stackone-ai-node/commit/366f3ca82e6f1acb19c6d62aa180efc4c8e6cdef))
* feedback tool  ([#125](https://github.com/StackOneHQ/stackone-ai-node/issues/125)) ([d943e60](https://github.com/StackOneHQ/stackone-ai-node/commit/d943e603db194646828243a5c7615beaa7c1b5c2))
* init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
* introduce MCP-backed dynamic tools ([#114](https://github.com/StackOneHQ/stackone-ai-node/issues/114)) ([ef5efc1](https://github.com/StackOneHQ/stackone-ai-node/commit/ef5efc172a863f692ab7da4573723ba77c9c1c19))
* **lint:** configure unicorn/prefer-top-level-await rule ([#218](https://github.com/StackOneHQ/stackone-ai-node/issues/218)) ([1254196](https://github.com/StackOneHQ/stackone-ai-node/commit/1254196c7c8e063f56993bc1c65b185058c21a8d))
* make AI SDK and OpenAI SDK optional peer dependencies ([#112](https://github.com/StackOneHQ/stackone-ai-node/issues/112)) ([e745640](https://github.com/StackOneHQ/stackone-ai-node/commit/e7456400c585f3dd4c39fa1d9977ecfd1bce225c))
* **meta-tools:** add hybrid BM25 + TF-IDF search strategy ([#122](https://github.com/StackOneHQ/stackone-ai-node/issues/122)) ([46fc31a](https://github.com/StackOneHQ/stackone-ai-node/commit/46fc31acd60b03091b56fffb1486730e57d9ee72))
* npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
* readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
* remove deprecated OAS-based getTools, migrate to fetchTools only ([#148](https://github.com/StackOneHQ/stackone-ai-node/issues/148)) ([aea526e](https://github.com/StackOneHQ/stackone-ai-node/commit/aea526e859af14c4280453ccd709c7e403e1901d))
* **tool:** add OpenAI Responses API integration ([#206](https://github.com/StackOneHQ/stackone-ai-node/issues/206)) ([1e286cf](https://github.com/StackOneHQ/stackone-ai-node/commit/1e286cfa23eef54c5f81a1fb546586bcd4fe0c7f))
* **toolsets:** add multi-account support for fetchTools ([#118](https://github.com/StackOneHQ/stackone-ai-node/issues/118)) ([926e625](https://github.com/StackOneHQ/stackone-ai-node/commit/926e6256174fe9aee1bdc54469f1cd545c9d706c))
* update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
* update schema ([#60](https://github.com/StackOneHQ/stackone-ai-node/issues/60)) ([03c9283](https://github.com/StackOneHQ/stackone-ai-node/commit/03c9283ab2169d29f24b0fd1f2c03700ce4500d3))
* use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))


### Bug Fixes

* add baseURL default ([#164](https://github.com/StackOneHQ/stackone-ai-node/issues/164)) ([83ad198](https://github.com/StackOneHQ/stackone-ai-node/commit/83ad198be6f1482645f933723b76f8d1f2f3e30b))
* building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
* **deps:** move zod from dev to prod catalog ([#230](https://github.com/StackOneHQ/stackone-ai-node/issues/230)) ([176c53f](https://github.com/StackOneHQ/stackone-ai-node/commit/176c53fc3277035fa2f41b88ec80cf7c38f280fe))
* docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
* docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
* docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
* hook ([#57](https://github.com/StackOneHQ/stackone-ai-node/issues/57)) ([ae92968](https://github.com/StackOneHQ/stackone-ai-node/commit/ae9296898738413ca129cbdc7d415cf58604e1f2))
* implement deep object serialization for nested filter parameters ([#40](https://github.com/StackOneHQ/stackone-ai-node/issues/40)) ([a5c3c1f](https://github.com/StackOneHQ/stackone-ai-node/commit/a5c3c1f1e4aae89e8ce9e75e98e123346969b331))
* **lefthook:** use pnpm ([#217](https://github.com/StackOneHQ/stackone-ai-node/issues/217)) ([e65099b](https://github.com/StackOneHQ/stackone-ai-node/commit/e65099b4eab9d757113d5ddbfb113820f38f0a15))
* **lint:** resolve all oxlint errors ([#193](https://github.com/StackOneHQ/stackone-ai-node/issues/193)) ([15e849f](https://github.com/StackOneHQ/stackone-ai-node/commit/15e849fa645e4df7280efe816bee8fecb1245177))
* name  ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
* oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
* oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
* oas regen ([#33](https://github.com/StackOneHQ/stackone-ai-node/issues/33)) ([80a8dbb](https://github.com/StackOneHQ/stackone-ai-node/commit/80a8dbb03e4e2324c351d34cfd7e88eb5058688f))
* **package.json:** add engines ([#182](https://github.com/StackOneHQ/stackone-ai-node/issues/182)) ([ef2189d](https://github.com/StackOneHQ/stackone-ai-node/commit/ef2189d1eb5131652bf651965a18d79dc0ea1035))
* remove an ambiguous keyword(saas) from package.json ([#145](https://github.com/StackOneHQ/stackone-ai-node/issues/145)) ([0e434e3](https://github.com/StackOneHQ/stackone-ai-node/commit/0e434e396777270c90ab7239b7f3e6b6f8832fd0))
* remove dotenv ([#101](https://github.com/StackOneHQ/stackone-ai-node/issues/101)) ([f1e6997](https://github.com/StackOneHQ/stackone-ai-node/commit/f1e6997dc84716d7b96be6415156fa4067315879))
* remove unecessary type assertion ([#111](https://github.com/StackOneHQ/stackone-ai-node/issues/111)) ([5d1502d](https://github.com/StackOneHQ/stackone-ai-node/commit/5d1502d977a5049cfe86704e66a7e4467102e6a7))
* remove unified API integration and migrate to connector-based naming ([#219](https://github.com/StackOneHQ/stackone-ai-node/issues/219)) ([79e0bc2](https://github.com/StackOneHQ/stackone-ai-node/commit/79e0bc2146ed3000374879971ba63042e54d3650))
* rename metaSearchTool ([#94](https://github.com/StackOneHQ/stackone-ai-node/issues/94)) ([e5a7279](https://github.com/StackOneHQ/stackone-ai-node/commit/e5a7279b7a46ad522e65f1e75dcbde58c010e312))
* resolve linting errors in generated OpenAPI files and tests ([#80](https://github.com/StackOneHQ/stackone-ai-node/issues/80)) ([7fd5eea](https://github.com/StackOneHQ/stackone-ai-node/commit/7fd5eea4b5ff19c4c3b119590a52c95175da4fc7))
* resolve type errors and ensure CI fails on errors ([#175](https://github.com/StackOneHQ/stackone-ai-node/issues/175)) ([4d465bf](https://github.com/StackOneHQ/stackone-ai-node/commit/4d465bfe461e7c34343fdc9b15c600ea2fb66544))
* resolve typecheck errors by upgrading to zod v4 and ai SDK 5.0.108 ([#183](https://github.com/StackOneHQ/stackone-ai-node/issues/183)) ([a2a4aaa](https://github.com/StackOneHQ/stackone-ai-node/commit/a2a4aaa4105c6c40d2272b97987c0f0cf5c5812a))
* **rpc:** send x-account-id as HTTP header in RPC requests ([#202](https://github.com/StackOneHQ/stackone-ai-node/issues/202)) ([b3843a5](https://github.com/StackOneHQ/stackone-ai-node/commit/b3843a5765b33767f452d8cca684e2429c5cbc99))
* **test:** stabilise examples ([#90](https://github.com/StackOneHQ/stackone-ai-node/issues/90)) ([015660d](https://github.com/StackOneHQ/stackone-ai-node/commit/015660d430724756da4d106bab1c10dba5d186d4))
* **tooling:** typecheck ([#54](https://github.com/StackOneHQ/stackone-ai-node/issues/54)) ([025ae5c](https://github.com/StackOneHQ/stackone-ai-node/commit/025ae5c2f503e3132fd2bcb5946a38128b701316))
* types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))
* validate tool_names after whitespace filtering ([#130](https://github.com/StackOneHQ/stackone-ai-node/issues/130)) ([5ea1c04](https://github.com/StackOneHQ/stackone-ai-node/commit/5ea1c04b217b6eed9ef4ac26e7c55e57fd35ca65))


### Miscellaneous Chores

* bun -&gt; pnpm+vitest && manage deps with flake.nix ([#143](https://github.com/StackOneHQ/stackone-ai-node/issues/143)) ([fb77062](https://github.com/StackOneHQ/stackone-ai-node/commit/fb77062f2dd0fd7dbc00f2e62ff2825b4e370b9f))
* **desp:** update openai sdk to v6 and deprecate v4 ([#120](https://github.com/StackOneHQ/stackone-ai-node/issues/120)) ([417ffc5](https://github.com/StackOneHQ/stackone-ai-node/commit/417ffc553725dc005d55f324439117e67c22701e))
* release 0.3.0 ([#88](https://github.com/StackOneHQ/stackone-ai-node/issues/88)) ([bd7c10c](https://github.com/StackOneHQ/stackone-ai-node/commit/bd7c10c11cf0b871e85533315c7543633fa56b1f))
* trigger release 2.0.0 ([#224](https://github.com/StackOneHQ/stackone-ai-node/issues/224)) ([407fe98](https://github.com/StackOneHQ/stackone-ai-node/commit/407fe9845ccc2dcae31f1d5094b9e6b8989856c5))


### Code Refactoring

* flatten client structure and add Zod validation to RPC client ([#168](https://github.com/StackOneHQ/stackone-ai-node/issues/168)) ([53bce87](https://github.com/StackOneHQ/stackone-ai-node/commit/53bce8708ec2f6cdbb6a2bfd18521725caf784da))
* remove unused exports and experimental features ([#221](https://github.com/StackOneHQ/stackone-ai-node/issues/221)) ([e131433](https://github.com/StackOneHQ/stackone-ai-node/commit/e1314333496de79aed06494dccb3314c5b46107d))

## [1.1.1](https://github.com/StackOneHQ/stackone-ai-node/compare/v1.1.0...v1.1.1) (2025-12-04)

### Bug Fixes

- remove an ambiguous keyword(saas) from package.json ([#145](https://github.com/StackOneHQ/stackone-ai-node/issues/145)) ([0e434e3](https://github.com/StackOneHQ/stackone-ai-node/commit/0e434e396777270c90ab7239b7f3e6b6f8832fd0))

## [1.1.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v1.0.0...v1.1.0) (2025-12-03)

### Features

- **meta-tools:** add hybrid BM25 + TF-IDF search strategy ([#122](https://github.com/StackOneHQ/stackone-ai-node/issues/122)) ([46fc31a](https://github.com/StackOneHQ/stackone-ai-node/commit/46fc31acd60b03091b56fffb1486730e57d9ee72))

## [1.0.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.3.0...v1.0.0) (2025-10-22)

### ⚠ BREAKING CHANGES

- **desp:** update openai sdk to v6 and deprecate v4 ([#120](https://github.com/StackOneHQ/stackone-ai-node/issues/120))

### Features

- add provider and action filtering to fetchTools() ([#124](https://github.com/StackOneHQ/stackone-ai-node/issues/124)) ([71fe4a4](https://github.com/StackOneHQ/stackone-ai-node/commit/71fe4a476e9e07e1348381b9926bacdbb986549f))
- feedback tool ([#125](https://github.com/StackOneHQ/stackone-ai-node/issues/125)) ([d943e60](https://github.com/StackOneHQ/stackone-ai-node/commit/d943e603db194646828243a5c7615beaa7c1b5c2))
- introduce MCP-backed dynamic tools ([#114](https://github.com/StackOneHQ/stackone-ai-node/issues/114)) ([ef5efc1](https://github.com/StackOneHQ/stackone-ai-node/commit/ef5efc172a863f692ab7da4573723ba77c9c1c19))
- make AI SDK and OpenAI SDK optional peer dependencies ([#112](https://github.com/StackOneHQ/stackone-ai-node/issues/112)) ([e745640](https://github.com/StackOneHQ/stackone-ai-node/commit/e7456400c585f3dd4c39fa1d9977ecfd1bce225c))
- **toolsets:** add multi-account support for fetchTools ([#118](https://github.com/StackOneHQ/stackone-ai-node/issues/118)) ([926e625](https://github.com/StackOneHQ/stackone-ai-node/commit/926e6256174fe9aee1bdc54469f1cd545c9d706c))

### Bug Fixes

- remove dotenv ([#101](https://github.com/StackOneHQ/stackone-ai-node/issues/101)) ([f1e6997](https://github.com/StackOneHQ/stackone-ai-node/commit/f1e6997dc84716d7b96be6415156fa4067315879))
- remove unecessary type assertion ([#111](https://github.com/StackOneHQ/stackone-ai-node/issues/111)) ([5d1502d](https://github.com/StackOneHQ/stackone-ai-node/commit/5d1502d977a5049cfe86704e66a7e4467102e6a7))
- rename metaSearchTool ([#94](https://github.com/StackOneHQ/stackone-ai-node/issues/94)) ([e5a7279](https://github.com/StackOneHQ/stackone-ai-node/commit/e5a7279b7a46ad522e65f1e75dcbde58c010e312))
- **test:** stabilise examples ([#90](https://github.com/StackOneHQ/stackone-ai-node/issues/90)) ([015660d](https://github.com/StackOneHQ/stackone-ai-node/commit/015660d430724756da4d106bab1c10dba5d186d4))
- validate tool_names after whitespace filtering ([#130](https://github.com/StackOneHQ/stackone-ai-node/issues/130)) ([5ea1c04](https://github.com/StackOneHQ/stackone-ai-node/commit/5ea1c04b217b6eed9ef4ac26e7c55e57fd35ca65))

### Miscellaneous Chores

- **desp:** update openai sdk to v6 and deprecate v4 ([#120](https://github.com/StackOneHQ/stackone-ai-node/issues/120)) ([417ffc5](https://github.com/StackOneHQ/stackone-ai-node/commit/417ffc553725dc005d55f324439117e67c22701e))

## [0.3.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.2.0...v0.3.0) (2025-08-19)

### ⚠ BREAKING CHANGES

- metaRelevantTools() renamed to metaTools() and now returns Promise<Tools>

### Features

- add meta tools for dynamic tool discovery and execution ([#84](https://github.com/StackOneHQ/stackone-ai-node/issues/84)) ([e1da427](https://github.com/StackOneHQ/stackone-ai-node/commit/e1da4276a5b00028fdfa6341a4c4d0898d187f88))
- add pkg.pr.new ci ([#58](https://github.com/StackOneHQ/stackone-ai-node/issues/58)) ([4757773](https://github.com/StackOneHQ/stackone-ai-node/commit/4757773d238ea18427c520e83000813f9b376d62))
- update schema ([#60](https://github.com/StackOneHQ/stackone-ai-node/issues/60)) ([03c9283](https://github.com/StackOneHQ/stackone-ai-node/commit/03c9283ab2169d29f24b0fd1f2c03700ce4500d3))

### Bug Fixes

- hook ([#57](https://github.com/StackOneHQ/stackone-ai-node/issues/57)) ([ae92968](https://github.com/StackOneHQ/stackone-ai-node/commit/ae9296898738413ca129cbdc7d415cf58604e1f2))
- resolve linting errors in generated OpenAPI files and tests ([#80](https://github.com/StackOneHQ/stackone-ai-node/issues/80)) ([7fd5eea](https://github.com/StackOneHQ/stackone-ai-node/commit/7fd5eea4b5ff19c4c3b119590a52c95175da4fc7))
- **tooling:** typecheck ([#54](https://github.com/StackOneHQ/stackone-ai-node/issues/54)) ([025ae5c](https://github.com/StackOneHQ/stackone-ai-node/commit/025ae5c2f503e3132fd2bcb5946a38128b701316))

### Miscellaneous Chores

- release 0.3.0 ([#88](https://github.com/StackOneHQ/stackone-ai-node/issues/88)) ([bd7c10c](https://github.com/StackOneHQ/stackone-ai-node/commit/bd7c10c11cf0b871e85533315c7543633fa56b1f))

## [0.2.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.1.0...v0.2.0) (2025-06-17)

### Features

- experimental doc handling ([#50](https://github.com/StackOneHQ/stackone-ai-node/issues/50)) ([366f3ca](https://github.com/StackOneHQ/stackone-ai-node/commit/366f3ca82e6f1acb19c6d62aa180efc4c8e6cdef))

## [0.1.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.0.14...v0.1.0) (2025-06-11)

### Features

- breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
- build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
- check pr title ([#45](https://github.com/StackOneHQ/stackone-ai-node/issues/45)) ([56ce286](https://github.com/StackOneHQ/stackone-ai-node/commit/56ce2867bb2db3c7550eb083f06c8881f9ca85c6))
- error from tools ([#31](https://github.com/StackOneHQ/stackone-ai-node/issues/31)) ([96e6745](https://github.com/StackOneHQ/stackone-ai-node/commit/96e6745da689da313658c881a2e144c238f85274))
- init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
- npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
- readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
- update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
- use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))

### Bug Fixes

- building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
- docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
- docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
- docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
- implement deep object serialization for nested filter parameters ([#40](https://github.com/StackOneHQ/stackone-ai-node/issues/40)) ([a5c3c1f](https://github.com/StackOneHQ/stackone-ai-node/commit/a5c3c1f1e4aae89e8ce9e75e98e123346969b331))
- name ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
- oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
- oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
- oas regen ([#33](https://github.com/StackOneHQ/stackone-ai-node/issues/33)) ([80a8dbb](https://github.com/StackOneHQ/stackone-ai-node/commit/80a8dbb03e4e2324c351d34cfd7e88eb5058688f))
- types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.14](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.13...ai-v0.0.14) (2025-04-04)

### Bug Fixes

- oas regen ([#33](https://github.com/StackOneHQ/stackone-ai-node/issues/33)) ([80a8dbb](https://github.com/StackOneHQ/stackone-ai-node/commit/80a8dbb03e4e2324c351d34cfd7e88eb5058688f))

## [0.0.13](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.12...ai-v0.0.13) (2025-03-24)

### Features

- error from tools ([#31](https://github.com/StackOneHQ/stackone-ai-node/issues/31)) ([96e6745](https://github.com/StackOneHQ/stackone-ai-node/commit/96e6745da689da313658c881a2e144c238f85274))

## [0.0.12](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.11...ai-v0.0.12) (2025-03-24)

### Features

- breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
- build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
- init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
- npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
- readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
- update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
- use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))

### Bug Fixes

- building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
- docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
- docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
- docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
- name ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
- oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
- oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
- types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.10](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.9...ai-v0.0.10) (2025-03-24)

### Features

- breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
- build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
- init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
- npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
- readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
- update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
- use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))

### Bug Fixes

- building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
- docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
- docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
- docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
- name ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
- oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
- oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
- types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.8](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.7...ai-v0.0.8) (2025-03-12)

### Features

- update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))

## [0.0.7](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.6...ai-v0.0.7) (2025-03-10)

### Features

- build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))

## [0.0.6](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.5...ai-v0.0.6) (2025-03-10)

### Features

- use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))

### Bug Fixes

- docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))

## [0.0.5](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.4...ai-v0.0.5) (2025-03-05)

### Features

- breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))

## [0.0.4](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.3...ai-v0.0.4) (2025-03-05)

### Features

- readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))

### Bug Fixes

- types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.3](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.2...ai-v0.0.3) (2025-03-04)

### Features

- init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
- npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))

### Bug Fixes

- building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
- docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
- docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
- name ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
- oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
- oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))

## [0.0.2](https://github.com/StackOneHQ/stackone-ai-node/compare/stackone-ai-node-v0.0.1...stackone-ai-node-v0.0.2) (2025-03-04)

### Features

- init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
- npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))

### Bug Fixes

- building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
- docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
- docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
