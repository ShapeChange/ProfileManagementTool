#!/usr/bin/env node

var service = require('./service').getService();

if (service) {
    service.on('start', function() {
        console.log('PMT service started');
    });

    service.start();
} else {
    console.error('PMT binary not found, could not start service');
}

