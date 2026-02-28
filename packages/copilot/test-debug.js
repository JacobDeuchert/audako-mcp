import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// Try different approaches
const testSchemas = {
  // Approach 1: Object with additionalProperties: true
  schema1: Type.Object({
    filter: Type.Object({}, { additionalProperties: true }),
  }),
};

const testData = { filter: { Name: 'test', $or: [{ x: 1 }] } };

for (const [name, schema] of Object.entries(testSchemas)) {
  const result = Value.Check(schema, testData);
  console.log(`${name}: ${result}`);
  if (!result) {
    const errors = [...Value.Errors(schema, testData)];
    console.log('  Errors:', errors.map(e => ({ path: e.path, message: e.message })));
  }
}
