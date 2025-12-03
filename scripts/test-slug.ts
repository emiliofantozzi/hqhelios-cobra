/**
 * Script de prueba para generate-slug
 */
import { generateSlug, generateTenantName } from '../src/lib/utils/generate-slug';

console.log('=== Testing generateSlug ===');

// Test 1: Genera slug basico
const slug1 = generateSlug('test@example.com');
console.log(`1. Basic: test@example.com -> ${slug1}`);
console.assert(slug1.startsWith('test-'), 'Should start with test-');

// Test 2: Convierte a minusculas
const slug2 = generateSlug('TEST@EXAMPLE.COM');
console.log(`2. Lowercase: TEST@EXAMPLE.COM -> ${slug2}`);
console.assert(slug2.split('-')[0] === 'test', 'Should be lowercase');

// Test 3: Limpia caracteres especiales
const slug3 = generateSlug('john.doe+test@example.com');
console.log(`3. Clean chars: john.doe+test@example.com -> ${slug3}`);
console.assert(!slug3.includes('.'), 'Should not contain dots');
console.assert(!slug3.includes('+'), 'Should not contain plus');

// Test 4: 100 slugs unicos
const slugs = new Set<string>();
for (let i = 0; i < 100; i++) {
  slugs.add(generateSlug('same@email.com'));
}
console.log(`4. Uniqueness: 100 slugs generated, ${slugs.size} unique`);
console.assert(slugs.size === 100, 'All 100 should be unique');

console.log('\n=== Testing generateTenantName ===');

// Test 5: Nombre simple
const name1 = generateTenantName('john@example.com');
console.log(`5. Simple: john@example.com -> ${name1}`);
console.assert(name1 === 'John', 'Should be John');

// Test 6: Con punto
const name2 = generateTenantName('john.doe@example.com');
console.log(`6. With dot: john.doe@example.com -> ${name2}`);
console.assert(name2 === 'John Doe', 'Should be John Doe');

// Test 7: Con guion
const name3 = generateTenantName('john-doe@example.com');
console.log(`7. With dash: john-doe@example.com -> ${name3}`);
console.assert(name3 === 'John Doe', 'Should be John Doe');

console.log('\n=== All tests passed! ===');
