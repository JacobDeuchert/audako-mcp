import { z } from 'zod';
import type { EntityFieldDefinition } from './types.js';
export declare function buildZodSchemaFromFieldDefinitions(fields: EntityFieldDefinition[], mode: 'create' | 'update'): z.AnyZodObject;
export declare function formatZodValidationErrors(error: z.ZodError): string[];
//# sourceMappingURL=zod-utils.d.ts.map