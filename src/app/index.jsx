import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader';
import createStore from './create-store'
import App from './components/container/App'

require('./less/app.less')

const render = (Component, store) => {
    ReactDOM.render(
        <AppContainer>
            <Provider store={ store }>
                <Component />
            </Provider>
        </AppContainer>,
        document.getElementById('app-wrapper')
    );
};


const store = createStore();

render(App, store);

// Hot Module Replacement API
if (module && module.hot) {
    module.hot.accept('./components/container/App', () => {
        render(App, store)
    });
/*module.hot.accept('./create-store', () => {
    render(App, createStore())
});*/
}
