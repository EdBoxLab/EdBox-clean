// Global polyfills for server-side rendering
if (typeof window === 'undefined') {
  (global as any).DOMMatrix = class {
    a=1;b=0;c=0;d=1;e=0;f=0;
    multiply(){return this}
    invertSelf(){return this}
  };
  (global as any).DOMMatrixReadOnly = (global as any).DOMMatrix;
  (global as any).Path2D = class {};
  (global as any).ImageData = class {
    width=0;height=0;data=new Uint8ClampedArray(0);
  };
}