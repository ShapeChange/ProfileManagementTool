import { createStore, applyMiddleware, combineReducers } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import { routerForBrowser, initializeCurrentLocation, push } from 'redux-little-router';
import { persistStore } from 'redux-persist'
import { createFilter } from 'redux-persist-transform-filter';
import createActionBuffer from 'redux-action-buffer'
import * as reducers from '../reducers'
import { actions as appActions } from '../reducers/app'
import createSyncIoMiddleware from './sync.io.js';

export default function (routes, data) {
    const { reducer: routerReducer, middleware: routerMiddleware, enhancer: routerEnhancer } = routerForBrowser({
        routes,
        basename: '/pmt'
    })

    const reducer = combineReducers({
        ...reducers,
        router: routerReducer
    })

    const socketIoMiddleware = createSyncIoMiddleware();
    //const reduxRouterMiddleware = routerMiddleware(history)

    const initMiddleware = createActionBuffer(appActions.initApp.toString());

    // Be sure to ONLY add this middleware in development!
    const middleware = process.env.NODE_ENV !== 'production' ?
        [require('redux-immutable-state-invariant').default(), socketIoMiddleware, routerMiddleware, initMiddleware] :
        [socketIoMiddleware, routerMiddleware, initMiddleware];

    const store = createStore(
        reducer,
        data,
        composeWithDevTools(
            routerEnhancer,
            applyMiddleware(...middleware),
            // other store enhancers if any
        )
    );

    const persistingStore = persistStore(store, {
        keyPrefix: 'PMT.',
        debounce: 1000,
        whitelist: ['auth', 'app'],
        transforms: [
            createFilter(
                'app',
                ['useThreePaneView', 'useSmallerFont', 'menuOpen', 'flattenInheritance', 'flattenOninas', 'showDefaultValues', 'busy']
            )
        ]
    }, () => {
        // ...after creating your store
        const initialLocation = store.getState().router;
        if (initialLocation) {
            //TODO
            setTimeout(function () {
                store.dispatch(initializeCurrentLocation(initialLocation));
            }, 500)

        }
    });

    if (module && module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept('../reducers', () => {
            const nextReducer = require('../reducers');
            store.replaceReducer(combineReducers(nextReducer));
        });
    }



    return store;
}
