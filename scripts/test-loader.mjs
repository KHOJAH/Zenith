import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export async function resolve(specifier, context, nextResolve) {
  let target = specifier;
  if (specifier.startsWith('@/')) {
    target = pathToFileURL(path.resolve(process.cwd(), 'src', specifier.slice(2))).href;
  }

  try {
    return await nextResolve(target, context);
  } catch (err) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const parentDir = path.dirname(parentPath);
    let basePath = target.startsWith('file://') ? fileURLToPath(target) : path.resolve(parentDir, target);

    for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const candidate = basePath + ext;
      if (existsSync(candidate)) {
        return await nextResolve(pathToFileURL(candidate).href, context);
      }
    }
    throw err;
  }
}
