var fs = require('fs'),
    XmlReader = require('xml-reader'),
    inFile = fs.createReadStream("../test/res/DGIF_IV_2016-2_Stand_Stewardbearbeitung.xml"),
    //inFile = fs.createReadStream("../test/res/PMT_UnitTest_Model.xml"),
    xmlStream = XmlReader.create({
        stream: true,
        parentNodes: true
    });
    /*,JSONStream = require("JSONStream"),
    jsonStream = JSONStream.stringify(),
    out = fs.createWriteStream('model.json'),
    classStream = JSONStream.stringify(),
    classOutFile = fs.createWriteStream('classes.json'),
    util = require('util');*/

// 1: 94s, 185MB
    // 5: 77s, 167MB
    // 10: 71s, 235MB
    // 25: 65s, 197MB
    // 50: 62s, 230MB
    // 100: 59s, 317MB
    // 1000: 56s, 567MB

var batchSize = 5;
//var collection = 'classes';
//var collection = 'packages';
var collection = 'models';

var streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;
var mongoStream = new streamToMongoDB({
    dbURL: "mongodb://localhost:27017/pmt01",
    collection: collection,
    batchSize: batchSize
});
var ObjectID = require('mongodb').ObjectID;
/*var pkgStream = new streamToMongoDB({
    dbURL: "mongodb://localhost:27017/pmt01",
    collection: "packages",
    batchSize: batchSize
});*/

//jsonStream.pipe(out);
//classStream.pipe(classOutFile);

var model = {
    _id: 'DGIF_IV_2016-2_Stand_Stewardbearbeitung',
    name: 'DGIF_IV_2016-2_Stand_Stewardbearbeitung',
    fileName: 'DGIF_IV_2016-2_Stand_Stewardbearbeitung.xml',
    modelName: '',
    type: 'mdl'
}

var profiles = []
var packages = {}
var numPackages = 0
var classes = 0
var classesWritten = 0
var properties = 0
var maxMemory = 0;

// TODO: use parent to analyze structure and find splitting points in big file
// one option would be to save classes with packages as materialized path
// also analyze possible read and write queries

xmlStream.on('tag:sc:Profile', function(profile) {
    //console.log(profile);

    if (profiles.indexOf(profile.attributes.name) === -1) {
        profiles.push(profile.attributes.name);
    }
});

xmlStream.on('tag:sc:Model', function(node) {
    //jsonStream.write(node);
});

xmlStream.on('tag', function(name, node) {
    //console.log(name)
    //console.log(process.memoryUsage());
    delete node.parent;

    for (var i = 0; i < node.children.length; i++) {
        if (node.children[i])
            delete node.children[i].parent;
    }
});

xmlStream.on('tag:sc:Package', function(node) {
    //console.log(node.children[0].children[0].value);

    /*if (packages.indexOf(node.attributes.name) === -1) {
        packages[profile.attributes.name] = {
            name: profile.attributes.name,
            classes: 0,
            properties: 0
        };
    }*/

    var path = '';
    var depth = 0;
    var parent;
    var current = node.parent;
    while (current !== null) {
        if (current.name === 'sc:Package') {
            //path = parent.children[0].children[0].value + '.' + path
            if (!current['_id'])
                current._id = new ObjectID();
            if (!parent)
                parent = current;
            depth++;
        }
        current = current.parent;
    }

    var id = node._id || new ObjectID();
    var parentId = parent && parent['_id'] ? parent['_id'].toHexString() : null

    //if (packages[node.children[0].children[0].value] && packages[node.children[0].children[0].value].depth === 0) {
    //console.log(packages[node.children[0].children[0].value].classes + ' ' + path)
    delete node.parent;
    delete node._id
    //console.log(util.inspect(node, false, null))
    var pkg = {
        //path: path.substr(0, path.length - 1),
        _id: id,
        parent: parentId,
        //depth: depth,
        model: model._id,
        type: 'pkg',
        name: node.children[0].children[0].value,
        element: node
    }


    mongoStream.write(pkg);
    //}

    numPackages++;
    /*if (packages === 1) {
        //console.log(node);
        jsonStream.write(node);
    }*/

    if (!parentId) {
        model.modelName = pkg.name;
    }
});

xmlStream.on('tag:sc:classes', function(node) {
    var i = node.parent.children.indexOf(node)
    if (i !== -1) {
        delete node.parent.children[i];
    //node.parent.children.splice(i, 1);
    //console.log(node.parent.children[0].children[0].value)
    }
//jsonStream.write(node);
});

xmlStream.on('tag:sc:Class', function(node) {
    /*var path = '';
    var parent = node.parent;
    var depth = 0;
    while (parent !== null) {
        if (parent.name === 'sc:Package') {
            savePkg(parent.children[0].children[0].value, depth++);
            path = parent.children[0].children[0].value + '.' + path
        }
        parent = parent.parent;
    }

    delete node.parent;*/
    //console.log(util.inspect(node, false, null))


    var parent;
    var current = node.parent;
    while (current !== null) {
        if (current.name === 'sc:Package') {
            //path = parent.children[0].children[0].value + '.' + path
            if (!current['_id'])
                current._id = new ObjectID();
            if (!parent)
                parent = current;
            break;
        }
        current = current.parent;
    }

    var id = node._id || new ObjectID();
    var parentId = parent && parent['_id'] ? parent['_id'].toHexString() : null

    var nameIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:name'
    })
    var localIdIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:id'
    })
    var stereotypeIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:stereotypes'
    })
    var baseClassIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:baseClassId'
    })
    var supertypesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:supertypes'
    })
    var propertiesIndex = node.children.findIndex(function(child) {
        return child.name === 'sc:properties'
    })

    delete node.parent;
    delete node._id

    var cls = {
        //path: path.substr(0, path.length - 1),
        _id: id,
        parent: parentId,
        model: model._id,
        type: 'cls',
        name: nameIndex > -1 && node.children[nameIndex].children[0].value,
        localid: localIdIndex > -1 && node.children[localIdIndex].children[0].value,
        stereotypes: stereotypeIndex > -1 && node.children[stereotypeIndex].children.map(function(st) {
                return st.children[0].value
            }),
        baseclass: baseClassIndex > -1 && node.children[baseClassIndex].children[0].value,
        supertypes: supertypesIndex > -1 && node.children[supertypesIndex].children.map(function(st) {
                return st.children[0].value
            }),
        properties: propertiesIndex > -1 && _reduceProperties(node.children[propertiesIndex], id),
        element: node
    }

    if (classes % batchSize == 0) {
        inFile.pause();
    }
    mongoStream.write(cls, function(cls) {
        classesWritten++;
        if (classes == classesWritten) {
            inFile.resume();
        }
    });

    //console.log(" - " + node.children[0].children[0].value + ' (' + path + ')');
    classes++;
    if (classes === 1) {
        //console.log(node);
        //jsonStream.write(node);
    }



    if (classes % batchSize == 0) {
        console.log(classes + ': ' + process.memoryUsage().heapUsed);
        maxMemory = Math.max(maxMemory, process.memoryUsage().heapUsed)
    }


//savePkg(path, depth);
});

/*function savePkg(pkg, depth) {
    if (packages[pkg]) {
        packages[pkg].classes++;
    } else {
        packages[pkg] = {
            name: pkg,
            classes: 1,
            depth: depth
        };
    }
}*/

xmlStream.on('tag:sc:Property', function(node) {
    //console.log("   - " + node.children[0].children[0].value);
    properties++;
});

var start = Date.now();

xmlStream.on("done", function(data) {
    model.profiles = profiles;
    mongoStream.write(model);

    //jsonStream.write(data);
    //jsonStream.end();
    mongoStream.end();
    //pkgStream.end();

    /*for (var i = 0; i < profiles.length; i++) {
        console.log(profiles[i]);
    }*/

    var maxDepth = 0;
    Object.keys(packages).map(function(key) {
        maxDepth = Math.max(maxDepth, packages[key].depth);
    })

    /*Object.keys(packages).map(function(key) {
        console.log(key + ' (' + packages[key].classes + ')' + ' (' + packages[key].depth + ')');
    })*/

    //console.log("maxDepth: ", maxDepth);
    console.log("packages: ", numPackages);
    console.log("classes: ", classes);
    console.log("properties: ", properties);
    console.log("maxMemory: ", maxMemory);
    console.log("took: ", Date.now() - start);

})

inFile
    .setEncoding('utf8')
    .on('data', function(chunk) {
        xmlStream.parse(chunk)
    })

// archiver, node-stream-zip


function _reduceProperties(properties, id) {
    return properties && properties.children ? properties.children.map(function(prop) {
        let p = prop.children.reduce(function(attrs, attr) {
            let key = attr.name.substr(3);
            key = key === 'id' ? '_id' : key

            attrs[key] = attr.children && attr.children[0] ? attr.children[0].value : ''

            return attrs
        }, {});
        p.parent = id;
        p.element = prop;
        p.type = 'prp'
        return p;
    }).sort(function(a, b) {
        return a.name > b.name ? 1 : -1
    }) : null;
}