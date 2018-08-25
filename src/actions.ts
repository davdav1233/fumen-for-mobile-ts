import { initState, State } from './states';
import { view } from './view';
import { app } from 'hyperapp';
import { withLogger } from '@hyperapp/logger';
import { default as i18next } from 'i18next';
import { default as LanguageDetector } from 'i18next-browser-languagedetector';
import { resources as resourcesJa } from './locales/ja/translation';
import { resources as resourcesEn } from './locales/en/translation';
import { PageEnv } from './env';
import { NextState } from './actions/commons';
import { DrawBlockActions, drawBlockActions } from './actions/draw_block';
import { animationActions, AnimationActions } from './actions/animation';
import { modeActions, ScreenActions } from './actions/screen';
import { modalActions, ModalActions } from './actions/modal';
import { pageActions, PageActions } from './actions/pages';
import { setterActions, SetterActions } from './actions/setter';
import { UtilsActions, utilsActions } from './actions/utils';

export type action = (state: Readonly<State>) => NextState;

export type Actions = DrawBlockActions
    & AnimationActions
    & ScreenActions
    & ModalActions
    & PageActions
    & SetterActions
    & UtilsActions;

export const actions: Readonly<Actions> = {
    ...drawBlockActions,
    ...animationActions,
    ...modeActions,
    ...modalActions,
    ...pageActions,
    ...setterActions,
    ...utilsActions,
};

// Mounting
const mount = (isDebug: boolean = false): Actions => {
    if (isDebug) {
        return withLogger(app)(initState, actions, view, document.body);
    }
    return app<State, Actions>(initState, actions, view, document.body);
};
export const main = mount(PageEnv.Debug);

// Loading
i18next.use(LanguageDetector).init({
    fallbackLng: 'en',
    resources: {
        en: { translation: resourcesEn },
        ja: { translation: resourcesJa },
    },
}, (error) => {
    if (error) {
        console.error('Failed to load i18n');
    } else {
        main.refresh();
    }
});

window.onresize = () => {
    main.resize({
        width: window.document.body.clientWidth,
        height: window.document.body.clientHeight,
    });
};

window.onload = () => {
    const extractFumenFromURL = () => {
        const url = decodeURIComponent(location.search);
        const paramQuery = url.substr(1).split('&').find(value => value.startsWith('d='));
        return paramQuery !== undefined ? paramQuery.substr(2) : 'v115@vhAAgH';
    };

    main.loadFumen({ fumen: extractFumenFromURL() });
};
