var Service = require('node-windows').Service;

exports.getService = function() {

try {
    var binary = require.resolve('pmt');

    var svc = new Service({
        name: 'ProfileManagementTool',
        description: '',
        script: binary,
        env: [
            {
                name: "NODE_ENV",
                value: 'production'
            },
            {
                name: "PMT_PLATFORM",
                value: 'windows'
            }
        ]
    });

    return svc;

} catch ( e ) {}

return null;

}