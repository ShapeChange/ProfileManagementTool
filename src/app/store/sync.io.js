import createSocketIoMiddleware from './redux-socket.io';
import io from 'socket.io-client';
import ss from 'socket.io-stream';
import { LOCATION_CHANGED } from 'redux-little-router';
import { actions as appActions, doesChangeState } from '../reducers/app'
import { actions, getModels, getPendingModel, getPendingPackage, getPendingClass } from '../reducers/model'

export default function createSyncIoMiddleware() {
    const socket = io({
        path: '/pmt/socket.io'
    });

    return createSocketIoMiddleware(socket, [LOCATION_CHANGED, appActions.startFileImport.toString(), appActions.startFileExport.toString()], {
        execute: conditionalExecute
    });
}

// where to put/get fetch metadata? what was fetched last?
function conditionalExecute(action, emit, next, store, socket) {
    /*if (doesChangeState(store.getState(), action)) {
        emit('action', action);
    }*/

    if (action.type === appActions.startFileImport.toString()) {

        next(action);

        const stream = ss.createStream();
        // upload a file to the server. 
        ss(socket).emit('import', stream, action.payload.metadata);
        const blobStream = ss.createBlobReadStream(action.payload.file);

        var written = 0;
        blobStream.on('data', function(chunk) {
            written += chunk.length;
            store.dispatch(appActions.progressFileImport({
                written: written
            }))
        });

        blobStream.pipe(stream);


    } else if (action.type === appActions.startFileExport.toString()) {

        next(action);

        const stream = ss.createStream();
        let fileBuffer = [];
        //let fileLength = 0;

        ss(socket).emit('export', stream, action.payload);

        stream.on('data', function(chunk) {
            //fileLength += chunk.length;
            //console.log(fileLength)
            fileBuffer.push(chunk);
        });

        stream.on('end', function() {

            store.dispatch(appActions.endFileExport(fileBuffer))
        });

    } else {
        // TODO: get owner from auth
        const models = getModels(store.getState());
        if (!models || models.length === 0) {
            emit('action', actions.fetchModels('unknown'));
        }

        const previousPendingModel = getPendingModel(store.getState())
        const previousPendingPackage = getPendingPackage(store.getState())
        const previousPendingClass = getPendingClass(store.getState())

        next(action);

        const pendingModel = getPendingModel(store.getState())
        const pendingPackage = getPendingPackage(store.getState())
        const pendingClass = getPendingClass(store.getState())

        if (pendingModel && pendingModel !== previousPendingModel)
            emit('action', actions.fetchModel(pendingModel));
        if (pendingPackage && pendingPackage !== previousPendingPackage)
            emit('action', actions.fetchPackage(pendingPackage));
        if (pendingClass && pendingClass !== previousPendingClass)
            emit('action', actions.fetchClass(pendingClass));
    }
}