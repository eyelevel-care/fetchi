<h1 align="center">
   Fetchi
</h1>

<p align="center">fetch wrapper client for the browser and applications</p>


<div align="center">


</div>

## Table of Contents

  - [Why Using Fetchi](#why-use-fetchi)
  - [Installatoin](#installing)
  - [Simple Examples](#example)
  - [Fetchi Controls](#controls)
  - [Config](#configurations)
  - [Mocking Response](#mocking)
  - [TypeScript](#typescript)
  - [Suger Codes](#suger-codes)

## Why use fetchi
<br />

Fetchi is a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) wrapper utility wrriten 100% in [TypeScript](https://www.typescriptlang.org/), in order to bring more functionalities like `Canceling`, `Retring`, `intercepting`, better `error handling` and easy `API Mocking`. because of using typescript, it ables you to handle everything type safe.

## Installing
<br />

Using npm:

```bash
$ npm install fetchi-request
```

Using yarn:

```bash
$ yarn add fetchi-request
```

Once the package is installed, you can import the library using `import` or `require` approach:

```typescript
import fetchi from 'fetchi-request';
```

## Example
<br />

```typescript
import fetchi, { FetchiError, FetchReseponse } from 'fetchi-request';

// Make a request for a user with a given ID
fetchi<Response>({url: '/user?ID=12345'})
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
  .catch((error: FetchiError) => {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });

// you can also see the full response (if the response is success)
fetchi<User>({ url: '/user' }, params: { ID: 12345 })
    .fullResponse((result: FetchReseponse<User>) => {
      // response here contains status, and the comprehensive configurations information of the request
      return {
        response: result.response,
        status: result.status,
        config: result.config
      }
    }).then((comprehensiveResponse: FetchResponse<User>) => {
      console.log(comprehensiveResponse)
    })

// you can use these http verbs "GET" (default), "POST", "PUT", "DELETE"
fetchi<User>({ url: '/user/12345' }, method: "PUT", params: { username: "myUsername" })

```


## Controls
<br />

With Fetchi you can have more control over your asyncronous actions (for requests).

```typescript

const request = fetchi<Response>({ url: '/someapi' })

// cancel the request and ignore the response (neither success nor failure would be called)
// it can be really useful when you don't need the response any more
request.cancel() 

// retry the request, if the response was pending, it would be canceld and do the request again, 
// all the listeners to the request would be called after the request is done
request.retry()

```


## Configurations
<br />
Here is a comprehensive configuration options sample: 


### Global Configurations
<br />

```typescript

// optionally you can set a base url for all of the requests (mutable).
fetchi.global.config.baseUrl = "https://your-domain.com"

// set default timeout config for all of the requests
fetchi.global.config.timeout = 5000 

// mutate the default header for all requests (useful for authorization)
fetchi.global.config.headers.set('Authorization', "the-token")

// intercept response before deliver the response to the listeners or intercept the request before dooing the request
fetchi.global.config.interceptors.response = (result, request) => {
  if (result.status == 401) {
    fetchi.global.config.headers.set('Authorization', "another-token")
    request.retry() // you can even retry the request it would cancel the request first (ignore the current response) and do it again.
  }
  // for example all the Apis return the target response type in the data hierarchy 
  return result.response.data; // mutates all the responses
}

// change the default validation checking for the responses (checking status)
fetchi.global.config.validateStatus = (status: number) => status >= 200 && status < 300

// check if any request is pending or not
fetchi.global.config.onPendingRequestsChanged = (isPending: boolean, numberOfRequests: number) => {
  // e.g.
  globalLoadingIndicator.isActive = isPending;
};

// you can see retry config for all of the requests!! (how many time retry and what should be the delay between them)
fetchi.global.config.retryConfig = {
    count: number;
    delay: number; // millisecnods
};
```

### Request Configurations
<br />

```typescript
  fetchi({ 
    url: '/your-end-point', // required value
    method: 'POST', // optional "GET" | "POST" " | "PUT" | "DELETE"
    params: { something: 'someValue' }, // query param (for GET requests), and body request for POST & PUT & DELETE requests
    cachePolicy: 'default' // Optional 'default' | 'no-cache' | 'reload' | 'force-cache' | 'only-if-cached';
    timeout: 4000, // timeout for this specific request (overwrite the global one)
    timeoutErrorMessage: "Timeout Message", // Optional timeout error message
    headers: { "Authorization": "myToken" }, // Optional Header option, it would be merged with the global config's header
    retryConfig: { // retry configuration for this request
      count: 2,
      delay: 1000 // millisecnods
    },
    validateStatus: (status: number) => status < 400, // validation logic for this specific request (status check)
    onPendingStatusChanged: (isLoading) => { console.log('isLoading', isLoading) } // listener for pending state of this request
  })
```

There are some other options for configurations but I prefered to seperate them in [Mocking Response](#mocking) topic.

## Mocking
<br />
There are two ways for mocking the response of requests:

### Globaly 
<br />
This approach can be used when you are going to centeralized all the server (mocking) functionality is one place and use it for all requests.

```typescript
import fetchi, { Adaptor, Config, FetchResponse, FetchiError } from 'fetchi-request';

class MockAdaptor implements Adaptor {
  request<T>(config: Config): Promise<FetchResponse<T>> {
    if (config.url === '/user') {
      return Promise.resolve({
        response: {
          name: 'myName',
          lastName: 'myLastName'
        } as T,
        status: 200,
        config,
      });
    }
    throw new FetchiError({
      data: Error('Invalid Url'),
      status: 800,
      config,
    });
  }

  cancel() {}
}

fetchi.global.config.mockAdaptor = new MockAdaptor();
```
<br />
After configuration of mockAdaptor, you can tell to all requests to use the mock adaptor or tell each request manually to use the mock adaptor:

```typescript
// all requests use mock adaptor
fetchi.global.config.useMock = true


// or set it (ON or OFF) manually for each request (it would override the global setting)
fetchi({
  url: "/user",
  useMock: true
})

```

### Mcok Single Request 
<br />
if you need to mock the response of only one request you can pass a mock adaptor to config of the request:

```typescript

fetchi({
  url: "/user",
  mockAdaptor: new MockAdaptor(), 
  useMock: true
})

```


## TypeScript
---
There are some useful types defined in this library like below: 

<br />
### FetchResponse<T>
<br />
You can see this type in the response of the requests by using `fullResponse` or `rawPromise` functions.
This type contains `status`, the request's `config`, and the body `response` of the request

<br />
### FetchError
<br />
It's almost the same as the FetchResponse type, but it's not only a type, it's an object which you can receive it in the errors or create it manually (for mock adaptors)

```typescript
    throw new FetchiError({
      data: Error('My Custom Error'),
      status: 800,
      config,
    });
```
<br />

### AnyAsyncService (the most useful one)
<br />
This is one of the most useful type that you can use, in order to hide the interface of Fetchi you can type erase it with `AnyAsyncService` type: 
For example if you want to hide the logic from the other part of your application, that you're fetching the data from server (or DataBase or location service or ....) you can use `AnyAsyncService` as interface for the other part of your application. 

```typescript
 const login = (credentials: Credentials): AnyAsyncService<User> =>
    fetchi<User>({
      url: '/login',
      method: 'POST',
      params: { user: credentials },
    })
```


## Suger Codes (handy codes)

Just like promise object you also can do such thing:

```typescript

fetchi.resolve(myObject) // it will return a response with 200 status, and `no url` for the configuration 

fetchi.reject(myCustomError) // it will throw FetchiError with custom data 

let req = fetchi.all([
  fetchi({ url: '/first'}),
  fetchi({ url: '/second'})
])

req.promise.then(([ firstRawResponse, secondRawResponse ]) => {
  // do something
})
// more controls
req.cancel() 
req.retry()


// race condition of two fetchi request, the second one would be canceled (ignored)
let req = fetchi.race([
  fetchi({ url: '/first'}),
  fetchi({ url: '/second'})
])

req.promise.then((rawResponse: FetchResponse<Something>) => {
  // do something
})
// more controls
req.cancel() 
req.retry()


```