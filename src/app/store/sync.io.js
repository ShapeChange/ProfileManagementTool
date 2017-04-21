import createSocketIoMiddleware from './redux-socket.io';
import io from 'socket.io-client';
import { doesChangeState } from '../reducers/app'
import { actions, getPendingModel, getPendingPackage, getPendingClass } from '../reducers/model'

export default function createSyncIoMiddleware() {
    const socket = io();

    return createSocketIoMiddleware(socket, ['ROUTER_LOCATION_CHANGED'], {
        execute: conditionalExecute
    });
}

// where to put/get fetch metadata? what was fetched last?
function conditionalExecute(action, emit, next, store) {
    /*if (doesChangeState(store.getState(), action)) {
        emit('action', action);
    }*/

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