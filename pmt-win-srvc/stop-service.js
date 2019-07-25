#!/usr/bin/env node

var service = require('./service').getService();

if (service && service.exists) {
    service.on('stop', function() {
        console.log('PMT service stopped');
    });

    service.stop();
}

