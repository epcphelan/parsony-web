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