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
    commentKey: string;
    currentIndex: number;
    actions: {
        updateCommentText: (data: { text?: string, pageIndex: number }) => void;
        commitCommentText: () => void;
    };
}

export const comment: Component<Props> = (
    {
        height, textColor, backgroundColorClass, dataTest, key, id, text,
        readonly, placeholder, commentKey, currentIndex, actions,
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
                dataTest,
                id,
                placeholder,
                commentKey,
                value: text,
                key: `${key}-${commentKey}`,
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

    const oninput = (event: KeyboardEvent) => {
        if (event.target !== null) {
            const target = event.target as HTMLInputElement;
            actions.updateCommentText({ text: target.value, pageIndex: currentIndex });
        }
    };

    const onenter = (event: KeyboardEvent) => {
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
        // 最後にEnterを押されたときのisComposingを記録する
        // IMEで変換しているときはtrueになる
        if (event.key === 'Enter') {
            lastComposingOnEnterDown = event.isComposing;
        }
    };

    const onkeyup = (event: KeyboardEvent) => {
        // 最後にエンターが押されたか (IMEには反応しない)
        if (!event.isComposing && !lastComposingOnEnterDown && event.key === 'Enter') {
            onenter(event);
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
            // `value` を設定すると、（undefinedでも）更新のたびにそれまで入力していた文字も消えてしまうため、使用しない
            dataTest,
            id,
            placeholder,
            commentKey,
            oncreate,
            oninput,
            onblur,
            onkeydown,
            onkeyup,
            key: `${key}-${commentKey}`,
            type: 'text',
            className: backgroundColorClass,
            style: commentStyle,
        }),
    ]);
};
