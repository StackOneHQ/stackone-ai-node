import { StackOneToolSet } from '../src/toolsets/stackone';

const toolset = new StackOneToolSet();
const tools = toolset.getStackOneTools();

let count = 0;
for (const tool of tools) {
  console.log(tool.name);
  count += 1;
  if (count >= 50) {
    break;
  }
}
console.log('Total tools enumerated (first 50):', count);
