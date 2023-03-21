export function isObject(value: any) {
  return value !== null && typeof value === 'object';
}

export function mergeHeaders(...sources: HeadersInit[]) {
  const result: { [x in string]: string } = {};

  for (let i = 0; i < sources.length; i += 1) {
    if (!isObject(sources[i])) {
      throw new TypeError('All arguments must be of type object');
    }

    const headers: Headers = new Headers(sources[i]);

    headers.forEach((value, key) => {
      if (value === undefined && value === 'undefined') {
        delete result[key];
      } else {
        result[key] = value;
      }
    });
  }

  return new Headers(result);
}
