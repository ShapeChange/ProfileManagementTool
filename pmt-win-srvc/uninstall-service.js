#!/usr/bin/env node

var service = require('./service').getService();

if (service && service.exists) {
    service.on('uninstall', function() {
        console.log('PMT service removed');
    });

    service.uninstall(10);
}

