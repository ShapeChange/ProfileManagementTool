var through2 = require('through2');
var multipipe = require('multipipe');
var unzipStream = require('unzip-stream');

exports.createStream = function(options) {
var file;

var toUnzip = through2({
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

return multipipe(unzipStream.Parse(), toUnzip)
};