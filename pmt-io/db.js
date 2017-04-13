var Promise = require("bluebird");
var db = require('../src/server/db');
var fs = require('fs');
var pkgOut = fs.createWriteStream('pkgs.json')
var classOut = fs.createWriteStream('classes.json')
var pkgStream = require("JSONStream").stringify();
var classStream = require("JSONStream").stringify();
pkgStream.pipe(pkgOut);
classStream.pipe(classOut);

db.connect("mongodb://localhost:27017/pmt01")
    .then(db.getPackages)
    .then(function(cursor) {
        var pr = new Promise(function(resolve, reject) {
            cursor.once('end', function() {
                resolve();
            });
        });
        cursor.pipe(pkgStream);
        return pr;
    })
    .then(db.getClasses)
    .then(function(cursor) {
        var pr = new Promise(function(resolve, reject) {
            cursor.once('end', function() {
                resolve();
            });
        });
        cursor.pipe(classStream);
        return pr;
    })
    .then(function() {
        db.close();
    })