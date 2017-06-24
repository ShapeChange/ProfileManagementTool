var convict = require('convict');
var path = require('path');

// Define a schema
var config = convict({
    env: {
        doc: "The applicaton environment.",
        format: ["production", "development", "test"],
        default: "development",
        env: "NODE_ENV"
    },
    platform: {
        doc: "The applicaton platform.",
        format: ["default", "docker", "windows"],
        default: "default",
        env: "PMT_PLATFORM"
    },
    server: {
        port: {
            doc: "The port to bind.",
            format: "port",
            default: 8000,
            env: "PORT"
        },
        path: {
            doc: "The path prefix.",
            format: String,
            default: "/pmt"
        },
        distFolder: {
            format: String,
            default: 'app'
        }
    },
    db: {
        host: {
            doc: "Database host name/IP",
            format: '*',
            default: 'localhost'
        },
        port: {
            doc: "Database port",
            format: "port",
            default: 27017
        },
        name: {
            doc: "Database name",
            format: String,
            default: 'pmt01'
        },
        url: {
            doc: "Database URL",
            format: '*',
            default: null
        }
    },
    app: {
        geometry: {
            doc: "Allowed geometries for feature types",
            format: Array,
            default: ["P", "C", "S", "So", "MP", "MC", "MS", "MSo"]
        },
        flattenInheritance: {
            doc: "Flatten model inheritance",
            format: Boolean,
            default: false
        },
        flattenOninas: {
            doc: "Flatten model ONINAs",
            format: Boolean,
            default: false
        }
    }
});

var configFolder = path.resolve(__dirname, './cfg')

// Load environment dependent configuration
var env = config.get('env');
config.loadFile(path.resolve(configFolder, env + '.json'));

// Load platform dependent configuration
var platform = config.get('platform');
if (platform !== config.default('platform')) {
    config.loadFile(path.resolve(configFolder, platform + '.json'));
}

// Load local configuration
if (platform === 'windows') {
    config.loadFile(path.resolve('../../', 'config.json'));
}

// Build MongoDB Connection URI
if (config.get('db.url') === config.default('db.url')) {
    config.set('db.url', 'mongodb://' + config.get('db.host') + ':' + config.get('db.port') + '/' + config.get('db.name'))
}

// resolve distFolder
config.set('server.distFolder', path.resolve(__dirname, config.get('server.distFolder')))

// Perform validation
config.validate({
    allowed: 'strict'
});

console.log(config.toString())

module.exports = config;