// Global polyfills for server-side rendering
if (typeof window === 'undefined') {
  // DOMMatrix Polyfill
  if (!global.DOMMatrix) {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
      public a: number = 1;
      public b: number = 0;
      public c: number = 0;
      public d: number = 1;
      public e: number = 0;
      public f: number = 0;

      constructor(init?: string | number[]) {
        if (Array.isArray(init)) {
          if (init.length === 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          }
        }
      }

      multiply(other: DOMMatrix): DOMMatrix {
        const result = new (global.DOMMatrix as any)();
        result.a = this.a * other.a + this.b * other.c;
        result.b = this.a * other.b + this.b * other.d;
        result.c = this.c * other.a + this.d * other.c;
        result.d = this.c * other.b + this.d * other.d;
        result.e = this.e * other.a + this.f * other.c + other.e;
        result.f = this.e * other.b + this.f * other.d + other.f;
        return result;
      }

      translate(x: number = 0, y: number = 0): DOMMatrix {
        const result = new (global.DOMMatrix as any)();
        result.a = this.a;
        result.b = this.b;
        result.c = this.c;
        result.d = this.d;
        result.e = this.a * x + this.c * y + this.e;
        result.f = this.b * x + this.d * y + this.f;
        return result;
      }

      scale(scaleX: number = 1, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix {
        // Basic scale support
        const result = new (global.DOMMatrix as any)();
        result.a = this.a * scaleX;
        result.b = this.b * scaleX;
        result.c = this.c * (scaleY ?? scaleX);
        result.d = this.d * (scaleY ?? scaleX);
        result.e = this.e;
        result.f = this.f;
        return result;
      }

      transformPoint(point: { x?: number, y?: number, z?: number, w?: number } = {}) {
        const x = point.x ?? 0;
        const y = point.y ?? 0;
        return {
          x: x * this.a + y * this.c + this.e,
          y: x * this.b + y * this.d + this.f,
          z: point.z ?? 0,
          w: point.w ?? 1
        };
      }

      inverse(): DOMMatrix {
        // Determinant
        const det = this.a * this.d - this.b * this.c;
        if (det === 0) return this; // Non-invertible returns self in some impls or throws. 

        const result = new (global.DOMMatrix as any)();
        result.a = this.d / det;
        result.b = -this.b / det;
        result.c = -this.c / det;
        result.d = this.a / det;
        result.e = (this.c * this.f - this.d * this.e) / det;
        result.f = (this.b * this.e - this.a * this.f) / det;
        return result;
      }

      invertSelf() {
        const inv = this.inverse();
        this.a = inv.a; this.b = inv.b; this.c = inv.c;
        this.d = inv.d; this.e = inv.e; this.f = inv.f;
        return this;
      }

      toString() {
        return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
      }
    };
  }

  // DOMMatrixReadOnly Polyfill
  if (!global.DOMMatrixReadOnly) {
    // @ts-ignore
    global.DOMMatrixReadOnly = global.DOMMatrix;
  }

  // Path2D Polyfill (stub)
  if (!global.Path2D) {
    // @ts-ignore
    global.Path2D = class Path2D {
      addPath() { }
      closePath() { }
      moveTo() { }
      lineTo() { }
      bezierCurveTo() { }
      quadraticCurveTo() { }
      arc() { }
      arcTo() { }
      ellipse() { }
      rect() { }
    };
  }

  // ImageData Polyfill
  if (!global.ImageData) {
    // @ts-ignore
    global.ImageData = class ImageData {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    };
  }
}
