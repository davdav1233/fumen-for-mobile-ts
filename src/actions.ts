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
import { fieldEditorActions, FieldEditorActions } from './actions/field_editor';
import { animationActions, AnimationActions } from './actions/animation';
import { modeActions, ScreenActions } from './actions/screen';
import { modalActions, ModalActions } from './actions/modal';
import { pageActions, PageActions } from './actions/pages';
import { setterActions, SetterActions } from './actions/setter';
import { UtilsActions, utilsActions } from './actions/utils';
import { mementoActions, MementoActions } from './actions/memento';
import { CommentActions, commentActions } from './actions/comment';
import { convertActions, ConvertActions } from './actions/convert';
import { userSettingsActions, UserSettingsActions } from './actions/user_settings';
import { i18n } from './locales/keys';
import { getURLQuery } from './params';
import { localStorageWrapper } from './memento';

export type action = (state: Readonly<State>) => NextState;

export type Actions = AnimationActions
    & ScreenActions
    & ModalActions
    & PageActions
    & SetterActions
    & UtilsActions
    & MementoActions
    & FieldEditorActions
    & CommentActions
    & ConvertActions
    & UserSettingsActions;

export const actions: Readonly<Actions> = {
    ...animationActions,
    ...modeActions,
    ...modalActions,
    ...pageActions,
    ...setterActions,
    ...utilsActions,
    ...mementoActions,
    ...fieldEditorActions,
    ...commentActions,
    ...convertActions,
    ...userSettingsActions,
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

declare const M: any;

window.addEventListener('load', () => {
    loadFumen();
    loadUserSettings();
});

const loadFumen = () => {
    const urlQuery = getURLQuery();

    // i18nの設定
    const languageDetector = new LanguageDetector(null, {
        order: ['myQueryDetector', 'querystring', 'navigator', 'path', 'subdomain'],
        cookieMinutes: 0,
    });
    languageDetector.addDetector({
        name: 'myQueryDetector',
        lookup() {
            return urlQuery.get('lng');
        },
        cacheUserLanguage() {
            // do nothing
        },
    });
    i18next
        .use(languageDetector)
        .init({
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

    // URLからロードする
    {
        const fumen = urlQuery.get('d');
        if (fumen !== undefined) {
            return main.loadFumen({ fumen });
        }
    }

    // LocalStrageからロードする
    {
        const fumen = localStorageWrapper.loadFumen();
        if (fumen) {
            M.toast({ html: i18n.Top.RestoreFromStorage(), classes: 'top-toast', displayLength: 1500 });
            return main.loadFumen({ fumen });
        }
    }

    // 空のフィールドを読み込む
    return main.loadNewFumen();
};

const loadUserSettings = () => {
    const settings = localStorageWrapper.loadUserSettings();

    if (settings.ghostVisible !== undefined) {
        main.changeGhostVisible({ visible: settings.ghostVisible });
    }
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((registration) => {
            console.log('SW registered: ', registration);
        }).catch((registrationError) => {
            console.error('SW registration failed: ', registrationError);
        });
    });
}
