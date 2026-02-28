import type { BaseEntityContract } from './base-entity.contract.js';
import type { EntityTypeDefinition } from './types.js';
export declare function listEntityTypeDefinitions(): EntityTypeDefinition[];
export declare function getSupportedEntityTypeNames(): string[];
export declare function resolveEntityTypeContract(entityType: string): BaseEntityContract<any, any, any> | undefined;
//# sourceMappingURL=index.d.ts.map