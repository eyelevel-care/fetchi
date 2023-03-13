export function isObject(value: any) {
  return value !== null && typeof value === 'object';
}

export function mergeHeaders(...sources: HeadersInit[]) {
  const result = {};

  for (const source of sources) {
    if (!isObject(source)) {
      throw new TypeError('All arguments must be of type object');
    }

    const headers: Headers = new Headers(source);
    // @ts-ignore
    for (const [key, value] of headers.entries()) {
      if (value === undefined || value === 'undefined') {
        delete result[key];
      } else {
        result[key] = value;
      }
    }
  }

  return new Headers(result);
}
