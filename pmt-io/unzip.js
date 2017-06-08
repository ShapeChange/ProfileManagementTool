var through2 = require('through2');
var multipipe = require('multipipe');
var unzipStream = require('unzip-stream');

exports.createStream = function(options) {
var file;

// does not respect backpressure because there is only one object, the file entry
/*var toUnzip = through2({
    writableObjectMode: true
}, function(entry, enc, cb) {
    if (!file && entry.type === 'File') {
        file = entry;
        entry
            .on('data', this.push.bind(this))
            .on('close', cb);
    } else {
        entry.autodrain();
        cb();
    }
})

return multipipe(unzipStream.Parse(), toUnzip)*/


var unzip = unzipStream.Parse();

var toUnzip = through2(function(chunk, enc, cb) {

    unzip.on('data', function(entry) {
        if (!file && entry.type === 'File') {
            console.log('FILE', entry)
            file = entry;
            file.on('data', this.push.bind(this))
        } else {
            entry.autodrain();
        }
    }.bind(this))

    if (!unzip.write(chunk)) {
        unzip.once('drain', cb);
    } else {
        process.nextTick(cb);
    }

}, function(cb) {
    file.on('end', function() {
        console.log('zip close')
        unzip.end();
        cb();
    });
})

return toUnzip;

};