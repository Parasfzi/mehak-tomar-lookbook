const http = require('http');

fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
}).then(r => r.json()).then(auth => {

    const req = http.request('http://localhost:5000/api/images/upload', {
        method: 'POST',
        headers: {
            'x-auth-token': auth.token,
            'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7xJ5x'
        }
    }, (res) => {
        res.on('data', d => console.log(d.toString()));
    });

    req.write('------WebKitFormBoundary7xJ5x\r\n');
    req.write('Content-Disposition: form-data; name="styleId"\r\n\r\n');
    req.write('65f6c6d00000000000000000\r\n');
    req.write('------WebKitFormBoundary7xJ5x\r\n');
    req.write('Content-Disposition: form-data; name="image"; filename="test.txt"\r\n');
    req.write('Content-Type: text/plain\r\n\r\n');
    req.write('hello world\r\n');
    req.write('------WebKitFormBoundary7xJ5x--\r\n');
    req.end();

}).catch(console.error);
