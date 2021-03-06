#Parsony Web Client
### Uses JSON/RPC protocol to connect WebApp to WebServices
Library provides built-connectivity to [Parsony WebServices](https://github.com/epcphelan/parsony-services-starter)
and is used by [Parsony WebApp Starter](https://github.com/epcphelan/parsony-react-starter).

* Handles request payload signing.
* Manages sessions using Http only cookies.

### Installation
```
$ npm install --save parsony-web
```

### Usage
```js
const PWS = require('parsony-web');
const configs = {
  "http_port": 8090,
  "api_key": "b58445978454a0d72a4dfabad96f5f8542ebf927.key",
  "secret":"c3af42468f78d431729ab501ee1df6d2d6e8e03d.secret",
  "services_uri": "http://localhost:8070/json-api",
  "endpoints":{
    "api":"/json-api",
    "sms":"/sms"
  },
  "static_files":"/dist"
}
const parsony = new PWS(configs);
parsony.start();
```

## License
### The MIT License

Copyright (c) 2010-2018 Google, Inc. http://angularjs.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.