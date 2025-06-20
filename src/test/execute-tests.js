const { run } = require('jest');
if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'test';
}
run();