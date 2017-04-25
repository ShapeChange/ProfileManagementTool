import { createStore, applyMiddleware, combineReducers } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
//import { routerReducer, routerMiddleware } from 'react-router-redux'
import { routerForBrowser, initializeCurrentLocation, push } from 'redux-little-router';
import * as reducers from '../reducers'
import createSyncIoMiddleware from './sync.io.js';

export default function(routes, data) {
    const {reducer: routerReducer, middleware: routerMiddleware, enhancer: routerEnhancer} = routerForBrowser({
        routes,
        basename: '/pmt'
    })

    const reducer = combineReducers({
        ...reducers,
        router: routerReducer
    })

    const socketIoMiddleware = createSyncIoMiddleware();
    //const reduxRouterMiddleware = routerMiddleware(history)


    // Be sure to ONLY add this middleware in development!
    const middleware = process.env.NODE_ENV !== 'production' ?
        [require('redux-immutable-state-invariant')(), socketIoMiddleware, routerMiddleware] :
        [socketIoMiddleware, routerMiddleware];

    const store = createStore(
        reducer,
        data,
        composeWithDevTools(
            routerEnhancer,
            applyMiddleware(...middleware),
        // other store enhancers if any
        )
    );

    if (module && module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept('../reducers', () => {
            const nextReducer = require('../reducers');
            store.replaceReducer(combineReducers(nextReducer));
        });
    }

    // ...after creating your store
    const initialLocation = store.getState().router;
    console.log(initialLocation)
    if (initialLocation) {
        if (!initialLocation.params || !initialLocation.params.profileId)
            store.dispatch(push('/profile/DGIF_IV_2016-2_Stand_Stewardbearbeitung/HG/'));
        else
            store.dispatch(initializeCurrentLocation(initialLocation));
    }

    return store
}
