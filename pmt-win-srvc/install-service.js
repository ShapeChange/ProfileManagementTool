#!/usr/bin/env node

var service = require('./service').getService();

if (service) {
    service.on('install', function() {
        service.start();
        console.log('PMT service installed');
    });

    service.install();
} else {
    console.error('PMT binary not found, could not install service');
}