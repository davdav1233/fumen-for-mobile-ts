import { div } from '@hyperapp/html';
import { iconContents, toolButton } from '../editor_buttons';
import { EditorLayout, toolStyle } from './editor';
import { TouchTypes } from '../../lib/enums';

export const utilsMode = ({ layout, touchType, actions }: {
    layout: EditorLayout;
    touchType: TouchTypes;
    actions: {
        changeToShiftMode: () => void;
        changeToFillRowMode: () => void;
        changeToFillMode: () => void;
        changeToCommentMode: () => void;
        convertToGray: () => void;
        clearField: () => void;
        convertToMirror: () => void;
    };
}) => {
    const toolButtonMargin = 5;

    return div({ style: toolStyle(layout) }, [
        div({ key: '', style: {}, class: '' }, "utils"),
        toolButton({
            borderWidth: 1,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'white',
            textColor: '#333',
            borderColor: '#333',
            datatest: 'btn-mirror',
            key: 'btn-mirror',
            onclick: () => {
                actions.convertToMirror();
            },
        }, iconContents({
            description: 'mirror',
            iconSize: 22,
            iconName: 'compare_arrows',
        })),
        toolButton({
            borderWidth: 1,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'white',
            textColor: '#333',
            borderColor: '#333',
            datatest: 'btn-convert-to-gray',
            key: 'btn-convert-to-gray',
            onclick: () => {
                actions.convertToGray();
            },
        }, iconContents({
            description: 'to gray',
            iconSize: 19,
            iconName: 'color_lens',
        })),
        toolButton({
            borderWidth: 1,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'white',
            textColor: '#333',
            borderColor: '#333',
            datatest: 'btn-clear-field',
            key: 'btn-clear-field',
            onclick: () => {
                actions.clearField();
            },
        }, iconContents({
            description: 'clear',
            iconSize: 22,
            iconName: 'clear',
        })),
        toolButton({
            borderWidth: 3,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'red',
            textColor: '#fff',
            borderColor: touchType === TouchTypes.Fill ? '#fff' : '#f44336',
            borderType: touchType === TouchTypes.Fill ? 'double' : undefined,
            datatest: 'btn-comment-mode',
            key: 'btn-comment-mode',
            onclick: () => actions.changeToCommentMode(),
        }, iconContents({
            marginRight: 0,
            description: 'comment',
            descriptionSize: 9,
            iconSize: 19,
            iconName: 'title',
        })),
        toolButton({
            borderWidth: 3,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'red',
            textColor: '#fff',
            borderColor: touchType === TouchTypes.Fill ? '#fff' : '#f44336',
            borderType: touchType === TouchTypes.Fill ? 'double' : undefined,
            datatest: 'btn-fill-mode',
            key: 'btn-fill-mode',
            onclick: () => actions.changeToFillMode(),
        }, iconContents({
            description: 'fill',
            iconSize: 20,
            iconName: 'brush',
        })),
        toolButton({
            borderWidth: 3,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'red',
            textColor: '#fff',
            borderColor: touchType === TouchTypes.FillRow ? '#fff' : '#f44336',
            borderType: touchType === TouchTypes.FillRow ? 'double' : undefined,
            datatest: 'btn-fill-row-mode',
            key: 'btn-fill-row-mode',
            onclick: () => actions.changeToFillRowMode(),
        }, iconContents({
            description: 'row',
            iconSize: 24,
            iconName: 'power_input',
        })),
        toolButton({
            borderWidth: 1,
            width: layout.buttons.size.width,
            margin: toolButtonMargin,
            backgroundColorClass: 'red',
            textColor: '#fff',
            borderColor: '#f44336',
            datatest: 'btn-slide-mode',
            key: 'btn-slide-mode',
            onclick: () => actions.changeToShiftMode(),
        }, iconContents({
            description: 'slide',
            iconSize: 24,
            iconName: 'swap_vert',
        })),
    ]);
};
