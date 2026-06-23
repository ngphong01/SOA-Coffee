/**
 * Saga Orchestrator — Quản lý distributed transactions qua các service.
 * Pattern: Orchestration-based Saga với compensating transactions.
 *
 * Flow:
 *  1. Execute steps sequentially
 *  2. If any step fails → execute compensating actions in reverse order
 *  3. Emit events via RabbitMQ để các service khác cập nhật state
 */
const { publish } = require('../rabbitmq/client');
const EVENTS = require('../rabbitmq/events');
const createLogger = require('./logger');

const logger = createLogger('SagaOrchestrator');

class SagaOrchestrator {
  constructor() {
    this.steps = [];
  }

  /**
   * Define a saga step với action và compensation
   * @param {string} name - Step name for logging
   * @param {Function} action - Main action (returns { success, data })
   * @param {Function} compensate - Compensating action (undo the action)
   */
  step(name, action, compensate) {
    this.steps.push({ name, action, compensate });
    return this;
  }

  /**
   * Execute all steps. Nếu step nào fail → chạy compensate theo thứ tự ngược.
   */
  async execute(context = {}) {
    const executed = [];
    const sagaId = `saga_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    logger.info(`Saga ${sagaId} started with ${this.steps.length} steps`);

    for (const step of this.steps) {
      try {
        logger.info(`Saga ${sagaId}: executing step "${step.name}"`);
        const result = await step.action(context);
        executed.push(step);
        Object.assign(context, result?.data || {});

        if (result?.success === false) {
          throw new Error(`Step "${step.name}" returned failure`);
        }
      } catch (error) {
        logger.error(`Saga ${sagaId}: step "${step.name}" FAILED — compensating ${executed.length} steps`, error);

        // Compensate in reverse order
        for (let i = executed.length - 1; i >= 0; i--) {
          const s = executed[i];
          try {
            logger.info(`Saga ${sagaId}: compensating "${s.name}"`);
            await s.compensate(context);
          } catch (compError) {
            logger.error(`Saga ${sagaId}: compensation "${s.name}" FAILED`, compError);
          }
        }

        // Emit saga failure event
        await publish('saga.failed', { sagaId, error: error.message, context });
        return { success: false, sagaId, error: error.message };
      }
    }

    logger.info(`Saga ${sagaId} completed successfully`);
    await publish('saga.completed', { sagaId, context });
    return { success: true, sagaId, context };
  }
}

// ── Pre-built Sagas ──

/**
 * Saga: Create Order (order-service → inventory-service → payment-service)
 */
const createOrderSaga = (orderApi, inventoryApi, paymentApi) => {
  return new SagaOrchestrator()
    .step(
      'create_order',
      async (ctx) => orderApi.create(ctx.orderData),
      async (ctx) => ctx.orderId && orderApi.cancel(ctx.orderId)
    )
    .step(
      'reserve_inventory',
      async (ctx) => inventoryApi.reserve(ctx.items),
      async (ctx) => inventoryApi.release(ctx.items)
    )
    .step(
      'process_payment',
      async (ctx) => paymentApi.process({ orderId: ctx.orderId, amount: ctx.totalAmount, method: ctx.paymentMethod }),
      async (ctx) => ctx.paymentId && paymentApi.refund(ctx.paymentId)
    )
    .step(
      'confirm_order',
      async (ctx) => {
        await orderApi.confirm(ctx.orderId);
        await publish(EVENTS.ORDER_COMPLETED, { orderId: ctx.orderId, ...ctx });
        return { success: true };
      },
      async (ctx) => {
        await orderApi.cancel(ctx.orderId);
        await publish('order.cancelled', { orderId: ctx.orderId });
      }
    );
};

/**
 * Saga: Process Refund (payment-service → order-service → inventory-service)
 */
const refundSaga = (paymentApi, orderApi, inventoryApi) => {
  return new SagaOrchestrator()
    .step(
      'process_refund',
      async (ctx) => paymentApi.refund(ctx.paymentId, ctx.amount, ctx.reason),
      async (ctx) => {
        /* refund undo not typical */
      }
    )
    .step(
      'cancel_order',
      async (ctx) => orderApi.markRefunded(ctx.orderId),
      async (ctx) => orderApi.reopen(ctx.orderId)
    )
    .step(
      'restore_inventory',
      async (ctx) => inventoryApi.restore(ctx.items),
      async (ctx) => {
        /* inventory restore undo not typical */
      }
    );
};

module.exports = { SagaOrchestrator, createOrderSaga, refundSaga };
