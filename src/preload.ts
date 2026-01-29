// Ensure Web Crypto API is available for libraries expecting globalThis.crypto
import * as nodeCrypto from 'crypto';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = (nodeCrypto as any).webcrypto || nodeCrypto;
}

export {};
