/**
 * Service Discovery Client — sử dụng Consul để dynamic discovery.
 * Fallback: dùng Docker DNS (service name → IP) nếu Consul không khả dụng.
 */
const createLogger = require('./logger');

const logger = createLogger('ServiceDiscovery');

const SERVICES = {
  auth: { name: 'auth-service', port: 3001 },
  user: { name: 'user-service', port: 3002 },
  product: { name: 'product-service', port: 3003 },
  category: { name: 'category-service', port: 3004 },
  inventory: { name: 'inventory-service', port: 3005 },
  order: { name: 'order-service', port: 3006 },
  payment: { name: 'payment-service', port: 3007 },
  analytics: { name: 'analytics-service', port: 3012 },
};

class ServiceDiscovery {
  constructor() {
    this.consulAvailable = false;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30s
  }

  /**
   * Resolve service URL. Dùng Consul nếu có, fallback Docker DNS.
   */
  async resolve(serviceKey) {
    const service = SERVICES[serviceKey];
    if (!service) throw new Error(`Unknown service: ${serviceKey}`);

    const cached = this.cache.get(serviceKey);
    if (cached && Date.now() - cached.ts < this.cacheTimeout) {
      return cached.url;
    }

    let url;
    try {
      // Try Consul first
      const consulUrl = await this._consulResolve(service.name);
      if (consulUrl) {
        url = consulUrl;
        this.consulAvailable = true;
      }
    } catch {
      this.consulAvailable = false;
    }

    // Fallback: Docker DNS
    if (!url) {
      url = `http://${service.name}:${service.port}`;
    }

    this.cache.set(serviceKey, { url, ts: Date.now() });
    return url;
  }

  async _consulResolve(serviceName) {
    const consulHost = process.env.CONSUL_HOST || 'consul';
    const consulPort = process.env.CONSUL_PORT || 8500;
    const response = await fetch(
      `http://${consulHost}:${consulPort}/v1/health/service/${serviceName}?passing=true`
    );
    if (!response.ok) return null;

    const nodes = await response.json();
    if (nodes.length === 0) return null;

    const node = nodes[0];
    const addr = node.Service.Address || node.Node.Address;
    return `http://${addr}:${node.Service.Port}`;
  }

  /**
   * Register current service with Consul
   */
  async register(serviceKey, port, metadata = {}) {
    const service = SERVICES[serviceKey];
    if (!service) return;

    const consulHost = process.env.CONSUL_HOST || 'consul';
    const consulPort = process.env.CONSUL_PORT || 8500;

    try {
      await fetch(`http://${consulHost}:${consulPort}/v1/agent/service/register`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: service.name,
          Port: port,
          Check: {
            HTTP: `http://${service.name}:${port}/health`,
            Interval: '10s',
            Timeout: '3s',
          },
          Meta: metadata,
        }),
      });
      logger.info(`Registered ${service.name} with Consul`);
    } catch {
      logger.warn(`Consul not available, using Docker DNS for ${service.name}`);
    }
  }
}

module.exports = new ServiceDiscovery();
module.exports.SERVICES = SERVICES;
