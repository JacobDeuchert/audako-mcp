import { pino } from 'pino';

const logger = pino({ name: 'port-allocator' });

export class PortAllocator {
  private usedPorts: Set<number>;
  private basePort: number;
  private maxPort: number;

  constructor(basePort: number = 30000, maxPort: number = 31000) {
    this.usedPorts = new Set();
    this.basePort = basePort;
    this.maxPort = maxPort;
    logger.info(`PortAllocator initialized: ${basePort}-${maxPort} (${maxPort - basePort} ports available)`);
  }

  /**
   * Allocates an available port from the pool
   * @returns port number or null if all ports are exhausted
   */
  allocatePort(): number | null {
    for (let port = this.basePort; port < this.maxPort; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        logger.debug({ port }, 'Port allocated');
        return port;
      }
    }
    logger.warn('No ports available in pool');
    return null;
  }

  /**
   * Releases a port back to the pool
   * @param port - port number to release
   */
  releasePort(port: number): void {
    if (this.usedPorts.has(port)) {
      this.usedPorts.delete(port);
      logger.debug({ port }, 'Port released');
    } else {
      logger.warn({ port }, 'Attempted to release port that was not allocated');
    }
  }

  /**
   * Gets the count of available ports
   * @returns number of available ports
   */
  getAvailableCount(): number {
    return (this.maxPort - this.basePort) - this.usedPorts.size;
  }

  /**
   * Gets the count of used ports
   * @returns number of used ports
   */
  getUsedCount(): number {
    return this.usedPorts.size;
  }

  /**
   * Checks if a specific port is in use
   * @param port - port number to check
   * @returns true if port is in use
   */
  isPortInUse(port: number): boolean {
    return this.usedPorts.has(port);
  }
}
