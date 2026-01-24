import './src/lib/polyfills';

console.log('--- Testing DOMMatrix Polyfill ---');

try {
    // @ts-ignore
    if (typeof global.DOMMatrix === 'undefined') {
        throw new Error('global.DOMMatrix is NOT defined!');
    }
    console.log('✓ global.DOMMatrix is defined');

    // @ts-ignore
    const matrix = new global.DOMMatrix([1, 0, 0, 1, 10, 20]);
    console.log('✓ DOMMatrix instantiated', matrix.toString());

    if (matrix.e !== 10 || matrix.f !== 20) {
        throw new Error('Matrix initialization failed');
    }

    // Test multiply
    // @ts-ignore
    const m2 = new global.DOMMatrix();
    m2.translate(5, 5);
    const m3 = matrix.multiply(m2);
    console.log('✓ Matrix multiplication success');

    // Test PDF parse dependency simulation (pdf-parse often uses checks like this)
    // @ts-ignore
    if (typeof global.DOMMatrixReadOnly === 'undefined') {
        throw new Error('global.DOMMatrixReadOnly is missing (needed for some libs)');
    }
    console.log('✓ global.DOMMatrixReadOnly is defined');

    console.log('--- ALL CHECKS PASSED ---');
    process.exit(0);
} catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
}
