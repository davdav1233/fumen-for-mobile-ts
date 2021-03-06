import { Component, px, style } from '../lib/types';
import { div, input } from '@hyperapp/html';

interface Props {
    dataTest: string;
    key: string;
    id: string;
    textColor: string;
    backgroundColorClass: string;
    height: number;
    text: string;
    readonly: boolean;
    placeholder?: string;
    currentIndex: number;
    actions: {
        updateCommentText: (data: { text?: string, pageIndex: number }) => void;
        commitCommentText: () => void;
    };
}

export const comment: Component<Props> = (
    {
        height, textColor, backgroundColorClass, dataTest, key, id, text,
        readonly, placeholder, currentIndex, actions,
    },
) => {
    const commentStyle = style({
        width: '100%',
        height: px(height),
        lineHeight: px(height),
        fontSize: px(height * 0.6),
        boxSizing: 'border-box',
        textAlign: 'center',
        border: 'none',
        color: textColor,
    });

    if (readonly) {
        return div({
            style: style({
                width: '100%',
                height: px(height),
                whiteSpace: 'nowrap',
            }),
        }, [
            input({
                id,
                key,
                dataTest,
                placeholder,
                value: text,
                type: 'text',
                className: backgroundColorClass,
                style: commentStyle,
                readonly: 'readonly',
            }),
        ]);
    }

    const oncreate = (element: HTMLInputElement) => {
        element.value = text;
    };

    const update = (event: KeyboardEvent | FocusEvent) => {
        if (event.target !== null) {
            const target = event.target as HTMLInputElement;
            actions.updateCommentText({ text: target.value, pageIndex: currentIndex });
        }
    };

    const blur = (event: KeyboardEvent) => {
        if (event.target !== null) {
            const target = event.target as HTMLInputElement;
            target.blur();
        }
    };

    const onblur = () => {
        actions.commitCommentText();
    };

    let lastComposingOnEnterDown = true;

    const onkeydown = (event: KeyboardEvent) => {
        // ?????????Enter????????????????????????isComposing???????????????
        // IME??????????????????????????????true?????????
        if (event.key === 'Enter') {
            lastComposingOnEnterDown = event.isComposing;
        }
    };

    const onkeyup = (event: KeyboardEvent) => {
        // ??????????????????????????????????????? (IME?????????????????????)
        if (!event.isComposing && !lastComposingOnEnterDown && event.key === 'Enter') {
            blur(event);
        }
    };

    return div({
        style: style({
            width: '100%',
            height: px(height),
            whiteSpace: 'nowrap',
        }),
    }, [
        input({
            // `value` ????????????????????????undefined????????????????????????????????????????????????????????????????????????????????????????????????????????????
            id,
            key,
            dataTest,
            placeholder,
            oncreate,
            onblur,
            onkeydown,
            onkeyup,
            oninput: update,
            onfocus: update,
            type: 'text',
            className: backgroundColorClass,
            style: commentStyle,
        }),
    ]);
};
