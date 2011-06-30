var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok\n');
}).listen(8080, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8080/');

/*
ab -r -n 10000 -c 8000 http://localhost:8080/
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 1000 requests
Completed 2000 requests
Completed 3000 requests
Completed 4000 requests
Completed 5000 requests
Completed 6000 requests
Completed 7000 requests
Completed 8000 requests
Completed 9000 requests
Completed 10000 requests
Finished 10000 requests


Server Software:        
Server Hostname:        localhost
Server Port:            8080

Document Path:          /
Document Length:        3 bytes

Concurrency Level:      8000
Time taken for tests:   1.488 seconds
Complete requests:      10000
Failed requests:        0
Write errors:           0
Total transferred:      670000 bytes
HTML transferred:       30000 bytes
Requests per second:    6719.97 [#/sec] (mean)
Time per request:       1190.481 [ms] (mean)
Time per request:       0.149 [ms] (mean, across all concurrent requests)
Transfer rate:          439.69 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   76  69.2     55     181
Processing:     4  123 127.7     82     751
Waiting:        3  117 128.6     53     750
Total:          6  199 182.9    199     806

Percentage of the requests served within a certain time (ms)
  50%    199
  66%    298
  75%    367
  80%    408
  90%    468
  95%    493
  98%    509
  99%    518
 100%    806 (longest request)
*/

/* + journey
% ab -r -n 10000 -c 8000 http://localhost:8080/api/ping
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 1000 requests
Completed 2000 requests
Completed 3000 requests
Completed 4000 requests
Completed 5000 requests
Completed 6000 requests
Completed 7000 requests
Completed 8000 requests
Completed 9000 requests
Completed 10000 requests
Finished 10000 requests


Server Software:        Chronos/1.0
Server Hostname:        localhost
Server Port:            8080

Document Path:          /api/ping
Document Length:        4 bytes

Concurrency Level:      8000
Time taken for tests:   2.077 seconds
Complete requests:      10000
Failed requests:        0
Write errors:           0
Total transferred:      1190000 bytes
HTML transferred:       40000 bytes
Requests per second:    4814.41 [#/sec] (mean)
Time per request:       1661.679 [ms] (mean)
Time per request:       0.208 [ms] (mean, across all concurrent requests)
Transfer rate:          559.49 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   67  66.2     11     176
Processing:    11  291 282.0    114    1749
Waiting:       11  288 283.3    105    1749
Total:         20  357 335.4    281    1781

Percentage of the requests served within a certain time (ms)
  50%    281
  66%    556
  75%    658
  80%    743
  90%    873
  95%    906
  98%    938
  99%    950
 100%   1781 (longest request)
*/

/* with my router :)
% ab -r -n 10000 -c 8000 http://localhost:8080/api/ping
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking localhost (be patient)
Completed 1000 requests
Completed 2000 requests
Completed 3000 requests
Completed 4000 requests
Completed 5000 requests
Completed 6000 requests
Completed 7000 requests
Completed 8000 requests
Completed 9000 requests
Completed 10000 requests
Finished 10000 requests


Server Software:        Chronos/1.0
Server Hostname:        localhost
Server Port:            8080

Document Path:          /api/ping
Document Length:        4 bytes

Concurrency Level:      8000
Time taken for tests:   1.954 seconds
Complete requests:      10000
Failed requests:        0
Write errors:           0
Total transferred:      1000000 bytes
HTML transferred:       40000 bytes
Requests per second:    5118.67 [#/sec] (mean)
Time per request:       1562.907 [ms] (mean)
Time per request:       0.195 [ms] (mean, across all concurrent requests)
Transfer rate:          499.87 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   63  62.3     11     169
Processing:     4  188 217.4     71     892
Waiting:        4  186 218.7     69     890
Total:          4  252 260.3     79     922

Percentage of the requests served within a certain time (ms)
  50%     79
  66%    339
  75%    462
  80%    542
  90%    651
  95%    747
  98%    800
  99%    818
 100%    922 (longest request)
*/
