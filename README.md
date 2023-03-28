<h1 align="center">
   Fetchi
</h1>

<p align="center">fetch wrapper client for the browser and applications</p>


<div align="center">


</div>

## Table of Contents

  - [Why Using Fetchi](#why-use-fetchi)
  - [Installing](#installing)
  - [Example](#example)
  - [Fetchi Controls](#axios-controls)
  - [Request Config](#request-config)
  - [Response Schema](#response-schema)
  - [Interceptors](#interceptors)

  - [Credits](#credits)
  - [License](#license)

## Why use fetchi

Fetchi is a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) wrapper utility wrriten 100% in [TypeScript](https://www.typescriptlang.org/), in order to bring more functionalities like `Cancel`, `Retry`, `intercepting`, `error handling`.

## Installing

<!-- ### Package manager -->

Using npm:

```bash
$ npm install fetchi-request
```

Using yarn:

```bash
$ yarn add fetchi-request
```

Once the package is installed, you can import the library using `import` or `require` approach:

```js
import fetchi from 'fetchi-request';
```

## Example

```js
import fetchi, { FetchiError } from 'fetchi-request';

// Make a request for a user with a given ID
fetchi<Response>({url: '/user?ID=12345'})
  .fullResponse((res) => {
    return {
      status: res.status,
      config: res.config.url,
      ...res.response 
    }
  })
  .then((response) => {
    // handle success
    console.log(response);
  })
  .catch((error: FetchiError) => {
    // handle error
    console.log(error);
  })
  .finally(() => {
    // always executed
  });

// Optionally the request above could also be done as
fetchi<User>({ url: '/user' }, params: { ID: 12345 })
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
