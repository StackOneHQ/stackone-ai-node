# Changelog

## [0.3.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.2.0...v0.3.0) (2025-08-19)


### ⚠ BREAKING CHANGES

* metaRelevantTools() renamed to metaTools() and now returns Promise<Tools>

### Features

* add meta tools for dynamic tool discovery and execution ([#84](https://github.com/StackOneHQ/stackone-ai-node/issues/84)) ([e1da427](https://github.com/StackOneHQ/stackone-ai-node/commit/e1da4276a5b00028fdfa6341a4c4d0898d187f88))
* add pkg.pr.new ci ([#58](https://github.com/StackOneHQ/stackone-ai-node/issues/58)) ([4757773](https://github.com/StackOneHQ/stackone-ai-node/commit/4757773d238ea18427c520e83000813f9b376d62))
* update schema ([#60](https://github.com/StackOneHQ/stackone-ai-node/issues/60)) ([03c9283](https://github.com/StackOneHQ/stackone-ai-node/commit/03c9283ab2169d29f24b0fd1f2c03700ce4500d3))


### Bug Fixes

* hook ([#57](https://github.com/StackOneHQ/stackone-ai-node/issues/57)) ([ae92968](https://github.com/StackOneHQ/stackone-ai-node/commit/ae9296898738413ca129cbdc7d415cf58604e1f2))
* resolve linting errors in generated OpenAPI files and tests ([#80](https://github.com/StackOneHQ/stackone-ai-node/issues/80)) ([7fd5eea](https://github.com/StackOneHQ/stackone-ai-node/commit/7fd5eea4b5ff19c4c3b119590a52c95175da4fc7))
* **tooling:** typecheck ([#54](https://github.com/StackOneHQ/stackone-ai-node/issues/54)) ([025ae5c](https://github.com/StackOneHQ/stackone-ai-node/commit/025ae5c2f503e3132fd2bcb5946a38128b701316))


### Miscellaneous Chores

* release 0.3.0 ([#88](https://github.com/StackOneHQ/stackone-ai-node/issues/88)) ([bd7c10c](https://github.com/StackOneHQ/stackone-ai-node/commit/bd7c10c11cf0b871e85533315c7543633fa56b1f))

## [0.2.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.1.0...v0.2.0) (2025-06-17)


### Features

* experimental doc handling ([#50](https://github.com/StackOneHQ/stackone-ai-node/issues/50)) ([366f3ca](https://github.com/StackOneHQ/stackone-ai-node/commit/366f3ca82e6f1acb19c6d62aa180efc4c8e6cdef))

## [0.1.0](https://github.com/StackOneHQ/stackone-ai-node/compare/v0.0.14...v0.1.0) (2025-06-11)


### Features

* breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
* build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
* check pr title ([#45](https://github.com/StackOneHQ/stackone-ai-node/issues/45)) ([56ce286](https://github.com/StackOneHQ/stackone-ai-node/commit/56ce2867bb2db3c7550eb083f06c8881f9ca85c6))
* error from tools ([#31](https://github.com/StackOneHQ/stackone-ai-node/issues/31)) ([96e6745](https://github.com/StackOneHQ/stackone-ai-node/commit/96e6745da689da313658c881a2e144c238f85274))
* init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
* npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
* readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
* update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
* use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))


### Bug Fixes

* building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
* docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
* docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
* docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
* implement deep object serialization for nested filter parameters ([#40](https://github.com/StackOneHQ/stackone-ai-node/issues/40)) ([a5c3c1f](https://github.com/StackOneHQ/stackone-ai-node/commit/a5c3c1f1e4aae89e8ce9e75e98e123346969b331))
* name  ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
* oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
* oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
* oas regen ([#33](https://github.com/StackOneHQ/stackone-ai-node/issues/33)) ([80a8dbb](https://github.com/StackOneHQ/stackone-ai-node/commit/80a8dbb03e4e2324c351d34cfd7e88eb5058688f))
* types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.14](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.13...ai-v0.0.14) (2025-04-04)


### Bug Fixes

* oas regen ([#33](https://github.com/StackOneHQ/stackone-ai-node/issues/33)) ([80a8dbb](https://github.com/StackOneHQ/stackone-ai-node/commit/80a8dbb03e4e2324c351d34cfd7e88eb5058688f))

## [0.0.13](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.12...ai-v0.0.13) (2025-03-24)


### Features

* error from tools ([#31](https://github.com/StackOneHQ/stackone-ai-node/issues/31)) ([96e6745](https://github.com/StackOneHQ/stackone-ai-node/commit/96e6745da689da313658c881a2e144c238f85274))

## [0.0.12](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.11...ai-v0.0.12) (2025-03-24)


### Features

* breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
* build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
* init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
* npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
* readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
* update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
* use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))


### Bug Fixes

* building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
* docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
* docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
* docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
* name  ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
* oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
* oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
* types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.10](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.9...ai-v0.0.10) (2025-03-24)


### Features

* breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))
* build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))
* init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
* npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))
* readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))
* update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))
* use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))


### Bug Fixes

* building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
* docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
* docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
* docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))
* name  ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
* oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
* oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))
* types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.8](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.7...ai-v0.0.8) (2025-03-12)


### Features

* update oas and add planner docs ([#21](https://github.com/StackOneHQ/stackone-ai-node/issues/21)) ([6dd4269](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd42697b8ea11bc4d62e62a3bab16b34fb49f4a))

## [0.0.7](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.6...ai-v0.0.7) (2025-03-10)


### Features

* build in ci ([#19](https://github.com/StackOneHQ/stackone-ai-node/issues/19)) ([40131d0](https://github.com/StackOneHQ/stackone-ai-node/commit/40131d08fae4f37007cc94be6980be6b2cf6e616))

## [0.0.6](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.5...ai-v0.0.6) (2025-03-10)


### Features

* use any openapi spec as tools ([#18](https://github.com/StackOneHQ/stackone-ai-node/issues/18)) ([6dd7aeb](https://github.com/StackOneHQ/stackone-ai-node/commit/6dd7aebd1b7b24dfa52abfa6442a336666cedbca))


### Bug Fixes

* docs links ([#16](https://github.com/StackOneHQ/stackone-ai-node/issues/16)) ([29fc021](https://github.com/StackOneHQ/stackone-ai-node/commit/29fc021729504db78e11ffc261d9e48bf3dd3c98))

## [0.0.5](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.4...ai-v0.0.5) (2025-03-05)


### Features

* breaking change ai sdk name and toolset config object ([#14](https://github.com/StackOneHQ/stackone-ai-node/issues/14)) ([ad1f207](https://github.com/StackOneHQ/stackone-ai-node/commit/ad1f2075a1fb9fd9e851577aef78b138ae8f3264))

## [0.0.4](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.3...ai-v0.0.4) (2025-03-05)


### Features

* readme ai sdk ([#10](https://github.com/StackOneHQ/stackone-ai-node/issues/10)) ([34d39cd](https://github.com/StackOneHQ/stackone-ai-node/commit/34d39cd11619a95572cae063af5813444bad609d))


### Bug Fixes

* types ([#13](https://github.com/StackOneHQ/stackone-ai-node/issues/13)) ([076766c](https://github.com/StackOneHQ/stackone-ai-node/commit/076766cc46c7bea8714f3f1aee7db0ff43f89979))

## [0.0.3](https://github.com/StackOneHQ/stackone-ai-node/compare/ai-v0.0.2...ai-v0.0.3) (2025-03-04)


### Features

* init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
* npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))


### Bug Fixes

* building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
* docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
* docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
* name  ([#6](https://github.com/StackOneHQ/stackone-ai-node/issues/6)) ([0952512](https://github.com/StackOneHQ/stackone-ai-node/commit/0952512f14bc23ef34431de9fc7663a948382aba))
* oas location ([#8](https://github.com/StackOneHQ/stackone-ai-node/issues/8)) ([380e495](https://github.com/StackOneHQ/stackone-ai-node/commit/380e49579ccff36f5de3a54aa349d39936add3bb))
* oas location and file upload ([#9](https://github.com/StackOneHQ/stackone-ai-node/issues/9)) ([e514a0f](https://github.com/StackOneHQ/stackone-ai-node/commit/e514a0f2ca484a5a1f3824a88b850ab869a148c0))

## [0.0.2](https://github.com/StackOneHQ/stackone-ai-node/compare/stackone-ai-node-v0.0.1...stackone-ai-node-v0.0.2) (2025-03-04)


### Features

* init ([468ffea](https://github.com/StackOneHQ/stackone-ai-node/commit/468ffeae1f8ea9ec77637a1451e2040bcbd8adcf))
* npm token ([#5](https://github.com/StackOneHQ/stackone-ai-node/issues/5)) ([1bb9095](https://github.com/StackOneHQ/stackone-ai-node/commit/1bb9095eb27a44888781fa892e68fb751cad2b20))


### Bug Fixes

* building docs ([#4](https://github.com/StackOneHQ/stackone-ai-node/issues/4)) ([c5dc1d2](https://github.com/StackOneHQ/stackone-ai-node/commit/c5dc1d248f9415f4599739410060dcd802872c1b))
* docs action ([#2](https://github.com/StackOneHQ/stackone-ai-node/issues/2)) ([1717c31](https://github.com/StackOneHQ/stackone-ai-node/commit/1717c31a92c557aec023be7e89f19dab6ff10c32))
* docs actions pt2 ([#3](https://github.com/StackOneHQ/stackone-ai-node/issues/3)) ([a9fbbc9](https://github.com/StackOneHQ/stackone-ai-node/commit/a9fbbc91446375b0916aacf5c13a9bdaec082680))
