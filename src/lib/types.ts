import { CSSProperties } from 'typestyle/lib/types';
import { VNode } from 'hyperapp';

export interface ModalInstance {
    open: () => void;
    close: () => void;
    destroy: () => void;
}

export const style: (properties: CSSProperties) => CSSProperties = properties => properties;

export type Children = string | number | (string | number | VNode<{}>)[];

export interface Component<Attributes = {}, State = {}, Actions = {}> {
    (attributes: Attributes, children?: string | (VNode | string)[]): VNode<object>;
}

export interface ComponentWithText<Attributes = {}, State = {}, Actions = {}> {
    (attributes: Attributes, children: string): VNode<object>;
}

export function px(value: number) {
    return value + 'px';
}
