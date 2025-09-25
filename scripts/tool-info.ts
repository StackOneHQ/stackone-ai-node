import { StackOneToolSet } from '../src/toolsets/stackone';

const toolset = new StackOneToolSet();
const tool = toolset.getStackOneTools('ats_list_applications').getStackOneTool('ats_list_applications');
console.dir(tool.parameters, { depth: 5 });
