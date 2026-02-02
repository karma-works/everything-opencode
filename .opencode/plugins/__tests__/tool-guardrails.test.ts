
import { ToolGuardrailsPlugin } from '../tool-guardrails';

const mockContext: any = { $: async () => {} };

describe('ToolGuardrailsPlugin', () => {
  it('should block dev servers outside tmux', async () => {
    const plugin = await ToolGuardrailsPlugin(mockContext);
    const hook = plugin['tool.execute.before'];
    if (!hook) throw new Error('Hook not found');

    const input = {
      tool: 'bash',
      args: { command: 'npm run dev' }
    };
    
    // Save original env
    const originalTmux = process.env.TMUX;
    delete process.env.TMUX;
    
    try {
      await hook(input, {});
      throw new Error('Should have thrown');
    } catch (e: any) {
      if (!e.message.includes('Dev server must run in tmux')) {
        throw e;
      }
    }
    
    // Restore
    if (originalTmux) process.env.TMUX = originalTmux;
  });

  it('should allow dev servers in tmux', async () => {
    const plugin = await ToolGuardrailsPlugin(mockContext);
    const hook = plugin['tool.execute.before'];
    if (!hook) throw new Error('Hook not found');

    const input = {
      tool: 'bash',
      args: { command: 'npm run dev' }
    };
    
    process.env.TMUX = '/tmp/tmux-1000';
    
    await hook(input, {}); // Should not throw
    
    delete process.env.TMUX;
  });
});
