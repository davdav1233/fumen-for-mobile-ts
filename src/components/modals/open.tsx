import { Component, style } from '../../lib/types';
import { h } from 'hyperapp';
import { resources } from '../../states';
import { i18n } from '../../locales/keys';
import { TextArea } from './textarea';
import { div } from '@hyperapp/@hyperapp/html';

declare const M: any;

interface OpenFumenModalProps {
    errorMessage?: string;
    textAreaValue: string;
    actions: {
        closeFumenModal: () => void;
        updateFumenData: (data: { value: string }) => void;
        clearFumenData: () => void;
        commitOpenFumenData: () => void;
    };
}

export const OpenFumenModal: Component<OpenFumenModalProps> = ({ textAreaValue, errorMessage, actions }) => {
    const close = () => {
        const modal = resources.modals.fumen;
        if (modal !== undefined) {
            modal.close();
        }
    };

    const destroy = () => {
        // resources.modals.fumen = undefined;
    };

    const cancel = () => {
        actions.closeFumenModal();
        actions.clearFumenData();
        close();
        destroy();
    };

    const oncreate = (element: HTMLDivElement) => {
        // const instance = M.Modal.init(element, {
        //     onOpenEnd: () => {
        //         const element = document.getElementById('input-fumen');
        //         if (element !== null) {
        //             element.focus();
        //         }
        //     },
        //     onCloseStart: () => {
        //         actions.closeFumenModal();
        //         actions.clearFumenData();
        //         destroy();
        //     },
        // });

        // instance.open();

        // resources.modals.fumen = instance;
    };

    const update = ({ value }: { value: string }) => {
        actions.updateFumenData({ value });
    };

    const focus = () => {
        const element = document.getElementById('input-fumen');
        if (element !== null) {
            element.focus();
        }
    };

    const open = () => {
        actions.commitOpenFumenData();
        focus();
    };

    const openClassVisibility = textAreaValue !== '' && errorMessage === undefined ? '' : ' disabled';
    const openClassName = `waves-effect waves-light btn red${openClassVisibility}`;

    return (
        <div key="open-fumen-modal-top">
            <div key="mdl-open-fumen" datatest="mdl-open-fumen"
                oncreate={oncreate} style="padding: 0 28px;">
                <div key="modal-content">
                    <p key="open-fumen-label" dataTest="open-fumen-label">{i18n.OpenFumen.Title()}</p>

                    <TextArea key="input-fumen" dataTest="input-fumen" id="input-fumen"
                              placeholder={i18n.OpenFumen.PlaceHolder()} error={errorMessage === undefined}
                              text={textAreaValue} actions={{ update }}
                    />

                    <span key="text-message" datatest="text-message" className="red-text text-accent-2"
                          style={style({ display: errorMessage !== undefined ? undefined : 'none' })}>
                        {errorMessage}
                    </span>
                </div>

                <div key="modal-footer" className="modal-footer">
                    <a href="#" key="btn-cancel" datatest="btn-cancel" id="btn-cancel"
                       className="waves-effect waves-teal btn-flat" onclick={cancel}>
                        {i18n.OpenFumen.Buttons.Cancel()}
                    </a>

                    <a href="#" key="btn-open" datatest="btn-open" id="btn-open"
                       className={openClassName} onclick={open}>
                        {i18n.OpenFumen.Buttons.Open()}
                    </a>
                </div>
            </div>
        </div>
    );
};
