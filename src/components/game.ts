import { HyperHammer, HyperStage } from '../lib/hyper';
import { Component, style } from '../lib/types';
import { nextPage } from '../index';
import { main } from '@hyperapp/html';

// Konvaは最後に読み込むこと！
// エラー対策：Uncaught ReferenceError: __importDefault is not define
import * as Konva from 'konva';

interface GameProps {
    canvas: {
        width: number;
        height: number;
    };
    stage: HyperStage;
    hammer: HyperHammer;
}

export const game: Component<GameProps> = (props, children) => {
    return main({
        id: 'container',
        style: style({
            width: props.canvas.width,
            height: props.canvas.height + 'px',
        }),
        canvas: props.canvas,
        oncreate: (element: HTMLMainElement) => {
            // この時点でcontainer内に新しい要素が作られるため、
            // この要素内には hyperapp 管理下の要素を作らないこと
            const stage = new Konva.Stage({
                container: element,
                width: props.canvas.width,
                height: props.canvas.height,
            });

            props.stage.addStage(stage);

            const hammer = new Hammer(element);
            // hammer.get('pinch').set({ enable: true });

            const hyperHammer = props.hammer;
            hyperHammer.register(hammer);
            hyperHammer.tap = (event) => {
                console.log(`${event.center.x} / ${props.canvas.width}`);
            };
            hammer.on('tap', hyperHammer.tap);
        },
        onupdate: (element: any, attr: any) => {
            if (attr.canvas.width !== props.canvas.width || attr.canvas.height !== props.canvas.height) {
                props.stage.resize(props.canvas);
            }
            const hyperHammer = props.hammer;
            hyperHammer.tap = (event) => {
                if (event.center.x < props.canvas.width / 2) {
                    console.log('tap left');
                } else {
                    nextPage();
                }
            };
        },
    }, children);
};