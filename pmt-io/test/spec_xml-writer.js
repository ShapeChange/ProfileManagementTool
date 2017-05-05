var Promise = require("bluebird");
var chai = require('chai');
var through2 = require('through2');
var intoStream = require('into-stream');
var xmlParser = require('xml-reader');
var xmlWriter = require('../xml-writer');

var should = chai.should();
var expect = chai.expect;

var xml = '<sc:Model encoding="UTF-8" xmlns:sc="http://shapechange.net/model"><sc:packages><sc:Package><sc:name>Model</sc:name><sc:id>1</sc:id><sc:descriptors></sc:descriptors><sc:packages></sc:packages></sc:Package></sc:packages></sc:Model>';

var xml2 = '<sc:Model encoding="UTF-8" xmlns:sc="http://shapechange.net/model"><sc:packages><sc:Package><sc:name>Model</sc:name><sc:id>1</sc:id><sc:descriptors><sc:alias><sc:descriptorValues><sc:DescriptorValue>leaf</sc:DescriptorValue></sc:descriptorValues></sc:alias></sc:descriptors><sc:packages></sc:packages></sc:Package></sc:packages></sc:Model>';

var xml3 = '<sc:alias><sc:descriptorValues><sc:DescriptorValue>leaf</sc:DescriptorValue></sc:descriptorValues></sc:alias>';

describe('XML Writer', function() {

it('should preserve order', function(done) {

    var writer;
    var written = [];

    var toXml = through2.obj(function(obj, enc, cb) {
        if (!writer) {
            writer = xmlWriter.create(this);
        }

        writer.print(obj).then(cb);
    });

    var toMem = through2.obj(function(chunk, enc, cb) {
        written.push(chunk.toString());
        cb();
    }, function(cb) {
        written = written.join('');
        cb();

        written.should.equal(xml)

        done();
    });

    var xmlStream = xmlParser.create({
        stream: false,
        parentNodes: false
    });

    xmlStream.on('done', function(ast) {
        intoStream.obj(ast).pipe(toXml).pipe(toMem);
    });

    xmlStream.parse(xml);

});

it('should preserve order with async handlers ', function(done) {

    var writer;
    var written = [];

    var toXml = through2.obj(function(obj, enc, cb) {
        if (!writer) {
            writer = xmlWriter.create(this, {
                handlers: {
                    'sc:descriptors': function(node, writer2) {
                        return new Promise(function(resolve, reject) {
                            var xmlStream2 = xmlParser.create({
                                stream: false,
                                parentNodes: false
                            });

                            xmlStream2.on('done', function(ast) {
                                resolve([ast]);
                            });

                            xmlStream2.parse(xml3);
                        })
                            .then(function(descriptors) {
                                return descriptors.reduce(function(pr, el) {
                                    return pr.then(function() {
                                        return writer2.print(el);
                                    });
                                }, Promise.resolve());
                            });
                    }
                }
            });
        }

        writer.print(obj).then(cb);
    });

    var toMem = through2.obj(function(chunk, enc, cb) {
        written.push(chunk.toString());
        cb();
    }, function(cb) {
        written = written.join('');
        cb();

        written.should.equal(xml2)

        done();
    });

    var xmlStream = xmlParser.create({
        stream: false,
        parentNodes: false
    });

    xmlStream.on('done', function(ast) {
        intoStream.obj(ast).pipe(toXml).pipe(toMem);
    });

    xmlStream.parse(xml2);

});
});
