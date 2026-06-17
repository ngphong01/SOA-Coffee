/**
 * Unit tests: Saga Orchestrator
 */
const { SagaOrchestrator } = require('../../shared/utils/sagaOrchestrator');

// Mock the RabbitMQ publish
jest.mock('../../shared/rabbitmq/client', () => ({
  publish: jest.fn().mockResolvedValue(true),
}));

describe('SagaOrchestrator', () => {
  test('should execute all steps in order', async () => {
    const saga = new SagaOrchestrator();
    const order = [];

    saga
      .step('step1',
        async (ctx) => { order.push('step1'); return { success: true, data: { val: 1 } }; },
        async (ctx) => { order.push('comp1'); }
      )
      .step('step2',
        async (ctx) => { order.push('step2'); return { success: true, data: { val2: ctx.val + 1 } }; },
        async (ctx) => { order.push('comp2'); }
      )
      .step('step3',
        async (ctx) => { order.push('step3'); return { success: true }; },
        async (ctx) => { order.push('comp3'); }
      );

    const result = await saga.execute({ initial: true });

    expect(result.success).toBe(true);
    expect(order).toEqual(['step1', 'step2', 'step3']);
    expect(result.context.val).toBe(1);
    expect(result.context.val2).toBe(2);
  });

  test('should compensate in reverse order on failure', async () => {
    const saga = new SagaOrchestrator();
    const order = [];

    saga
      .step('step1',
        async (ctx) => { order.push('step1'); return { success: true }; },
        async (ctx) => { order.push('comp1'); }
      )
      .step('step2',
        async (ctx) => { order.push('step2'); throw new Error('step2 failed'); },
        async (ctx) => { order.push('comp2'); }
      )
      .step('step3',
        async (ctx) => { order.push('step3'); return { success: true }; },
        async (ctx) => { order.push('comp3'); }
      );

    const result = await saga.execute({});

    expect(result.success).toBe(false);
    expect(order).toEqual(['step1', 'step2', 'comp1']);
    expect(result.error).toContain('step2 failed');
  });

  test('should handle compensation failures gracefully', async () => {
    const saga = new SagaOrchestrator();
    const order = [];

    saga
      .step('step1',
        async () => { order.push('step1'); return { success: true }; },
        async () => { order.push('comp1'); throw new Error('comp failed'); }
      )
      .step('step2',
        async () => { order.push('step2'); throw new Error('step2 failed'); },
        async () => { order.push('comp2'); }
      );

    const result = await saga.execute({});

    expect(result.success).toBe(false);
    expect(order).toEqual(['step1', 'step2', 'comp1']);
  });

  test('should handle step returning success=false', async () => {
    const saga = new SagaOrchestrator();
    const order = [];

    saga
      .step('step1',
        async () => { order.push('step1'); return { success: false }; },
        async () => { order.push('comp1'); }
      )
      .step('step2',
        async () => { order.push('step2'); return { success: true }; },
        async () => { order.push('comp2'); }
      );

    const result = await saga.execute({});

    expect(result.success).toBe(false);
    expect(order).toEqual(['step1', 'comp1']);
  });
});
