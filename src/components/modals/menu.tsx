import { Component, ComponentWithText, px, style } from '../../lib/types';
import { h } from 'hyperapp';
import { resources, State } from '../../states';
import { CommentType, Screens } from '../../lib/enums';
import { i18n } from '../../locales/keys';
import { Icon } from '../atomics/icons';
import { ClipboardButton } from '../modals/clipboard'
import { encode } from '../../lib/fumen/fumen';
import { FumenError } from '../../lib/errors';
import { AppendFumenModal } from '../modals/append'
import { Page } from '../../lib/fumen/types';
import { sequence } from '../..//actions/commons';

declare const M: any;

interface MenuProps {
    version: string;
    pages: Page[];
    screen: Screens;
    currentIndex: number;
    maxPageIndex: number;
    comment: CommentType;
    state: State
    actions: {
        closeMenuModal: () => void;
        changeToReaderScreen: () => void;
        changeToDrawerScreen: (data: { refresh?: boolean }) => void;
        changeCommentMode: (data: { type: CommentType }) => void;
        removeUnsettledItems: () => void;
        loadNewFumen: () => void;
        firstPage: () => void;
        lastPage: () => void;
        clearToEnd: () => void;
        clearPast: () => void;
        openAppendModal: () => void;
        openClipboardModal: () => void;
        changeGhostVisible: (data: { visible: boolean }) => void;
        reopenCurrentPage: () => void;
        openFumenModal: () => void;
        openUserSettingsModal: () => void;
    };
}

// the menu containing "readonly", "firstpage", "lastpage", etc.
export const MenuModal: Component<MenuProps> = (
    { version, pages, screen, currentIndex, maxPageIndex, comment, actions, state },
) => {
    const oncreate = (element: HTMLDivElement) => {
        // const instance = M.Modal.init(element, {
        //     onOpenEnd: () => {
        //         const element = document.getElementById('textarea-fumen');
        //         if (element !== null) {
        //             element.focus();
        //         }
        //     },
        //     onCloseStart: () => {
        //         actions.closeMenuModal();
        //     },
        // });

        // instance.open();

        // resources.modals.menu = instance;
    };

    const ondestroy = () => {
        const modal = resources.modals.menu;
        if (modal !== undefined) {
            modal.close();
        }
        resources.modals.menu = undefined;
    };

    const divProperties = style({
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'start',
        alignItems: 'center',
    });

    // テト譜の変換
    const encodePromise = (async () => {
        const encoded = await encode(pages);
        return `v115@${encoded}`;
    })();

    const clipboard = (domain: string) => () => {
        encodePromise
            .then((data) => {
                // データをElementに保存する // 主にテスト用
                document.body.setAttribute('datatest', 'copied-fumen-data');
                document.body.setAttribute('data', data);
                return data;
            })
            .then(data => `${domain}${data}`)
            .then((url) => {
                // コピー用のelementを作成
                const element = document.createElement('pre');
                if (element === undefined || element === null) {
                    throw new FumenError('no element');
                }

                {
                    const style = element.style;
                    style.position = 'fixed';
                    style.left = '-100%';
                    element.textContent = url;
                    document.body.appendChild(element);
                }

                // selection
                const selection = document.getSelection();
                if (selection === null) {
                    throw new FumenError('no selection');
                }

                // クリップボードにコピーする
                selection.selectAllChildren(element);
                const success = document.execCommand('copy');
                if (!success) {
                    throw new FumenError('command error');
                }

                // コピー用のelementを削除
                document.body.removeChild(element);
            })
            .then(() => {
                M.toast({ html: 'Copied to clipboard', classes: 'top-toast', displayLength: 600 });
            })
            .catch((error) => {
                M.toast({ html: `Failed to copy: ${error}`, classes: 'top-toast', displayLength: 1500 });
            });
    };

    return (
        <div key="menu-modal-top">
            <div key="mdl-open-fumen" datatest="mdl-open-fumen"
                 style="padding: 0 24px;" oncreate={oncreate} ondestroy={ondestroy}>
                <div key="modal-content">

                    {/* <h4 key="memu-title">
                        {i18n.Menu.Title()}&nbsp;
                        <span style={style({ color: '#999', fontSize: '50%' })}>[{i18n.Menu.Build(version)}]</span>
                    </h4> */}

                    <div key="menu-top" style={divProperties}>
                        {/* {screen === Screens.Editor ?
                            <SettingButton key="btn-readonly" datatest="btn-readonly" href="#"
                                           icons={[{ name: 'visibility', size: 31.25 }]}
                                           onclick={() => {
                                               actions.changeToReaderScreen();
                                               actions.closeMenuModal();
                                           }}>{i18n.Menu.Buttons.Readonly()}</SettingButton>
                            : undefined} */}

                        {screen === Screens.Reader ?
                            <SettingButton key="btn-writable" datatest="btn-writable" href="#"
                                           icons={[{ name: 'mode_edit', size: 31.25 }]}
                                           onclick={() => {
                                               actions.changeToDrawerScreen({ refresh: true });
                                               actions.closeMenuModal();
                                           }}>{i18n.Menu.Buttons.Writable()}</SettingButton>
                            : undefined}

                        <SettingButton key="btn-copy-fumen" datatest="btn-copy-fumen" href="#" //
                                       icons={[{ name: 'content_copy', size: 29.3 }]}
                                       onclick={() => {
                                           actions.removeUnsettledItems();
                                           actions.closeMenuModal();
                                           actions.openClipboardModal();
                                       }}>
                            {i18n.Menu.Buttons.Clipboard()}
                        </SettingButton>

                        <SettingButton key="btn-new-fumen" datatest="btn-new-fumen" href="#"
                                       icons={[{ name: 'insert_drive_file', size: 32.3 }]}
                                       onclick={() => {
                                           actions.removeUnsettledItems();
                                           actions.loadNewFumen();
                                           actions.changeToDrawerScreen({ refresh: true });
                                           actions.closeMenuModal();
                                       }}>
                            {i18n.Menu.Buttons.New()}
                        </SettingButton>

                        <SettingButton key="btn-open-fumen" datatest="btn-open-fumen" href="#"
                                       icons={[{ name: 'open_in_new', size: 32.3 }]}
                                       onclick={() => {
                                           actions.removeUnsettledItems();
                                           actions.closeMenuModal();
                                           actions.openFumenModal();
                                       }}>
                            {i18n.Menu.Buttons.Open()}
                        </SettingButton>

                        <SettingButton key="btn-append-fumen" datatest="btn-append-fumen" href="#"
                                       icons={[{ name: 'library_add', size: 29 }]}
                                       onclick={() => {
                                           actions.closeMenuModal();
                                           actions.openAppendModal();
                                       }}>
                            {i18n.Menu.Buttons.Append()}
                        </SettingButton>

                        <SettingButton key="btn-first-page" datatest="btn-first-page" href="#"
                                       icons={[{ name: 'fast_rewind', size: 32.3 }]}
                                       onclick={() => {
                                           actions.firstPage();
                                           actions.closeMenuModal();
                                       }}>
                            {i18n.Menu.Buttons.FirstPage()}
                        </SettingButton>

                        <SettingButton key="btn-last-page" datatest="btn-last-page" href="#"
                                       icons={[{ name: 'fast_forward', size: 32.3 }]}
                                       onclick={() => {
                                           actions.lastPage();
                                           actions.closeMenuModal();
                                       }}>
                            {i18n.Menu.Buttons.LastPage()}
                        </SettingButton>

                        <SettingButton key="btn-clear-past" datatest="btn-clear-past" href="#"
                                       icons={[{ name: 'arrow_back', size: 18 }, { name: 'clear', size: 28 }]}
                                       textSize={12} enable={0 < currentIndex}
                                       onclick={() => {
                                           actions.clearPast();
                                           actions.closeMenuModal();
                                       }}>
                            {i18n.Menu.Buttons.ClearPast()}
                        </SettingButton>

                        <SettingButton key="btn-clear-to-end" datatest="btn-clear-to-end" href="#"
                                       icons={[{ name: 'clear', size: 28 }, { name: 'arrow_forward', size: 18 }]}
                                       textSize={12} enable={currentIndex < maxPageIndex - 1}
                                       onclick={() => {
                                           actions.clearToEnd();
                                           actions.closeMenuModal();
                                       }}>
                            {i18n.Menu.Buttons.ClearToEnd()}
                        </SettingButton>

                        {/* <SettingButton key="btn-user-settings" datatest="btn-user-settings" href="#"
                                       icons={[{ name: 'build', size: 30 }]}
                                       onclick={() => {
                                           actions.closeMenuModal();
                                           actions.openUserSettingsModal();
                                       }}>
                            {i18n.Menu.Buttons.UserSettings()}
                        </SettingButton> */}

                        {comment !== CommentType.PageSlider ?
                            <SettingButton key="btn-page-slider" href="#"
                                           datatest="btn-page-slider"
                                           icons={[{ name: 'looks_one', size: 30 }]}
                                           onclick={() => {
                                               actions.changeCommentMode({ type: CommentType.PageSlider });
                                               actions.closeMenuModal();
                                           }}>
                                {i18n.Menu.Buttons.PageSlider()}
                            </SettingButton>
                            : undefined}

                        {screen === Screens.Reader && comment === CommentType.PageSlider ?
                            <SettingButton key="btn-show-comment" href="#"
                                           datatest="btn-show-comment"
                                           icons={[{ name: 'text_fields', size: 32 }]}
                                           onclick={() => {
                                               actions.changeCommentMode({ type: CommentType.Writable });
                                               actions.closeMenuModal();
                                           }}>
                                {i18n.Menu.Buttons.ShowComment()}
                            </SettingButton>
                            : undefined}

                        {screen === Screens.Editor && comment !== CommentType.Writable ?
                            <SettingButton key="btn-comment-writable" href="#"
                                           datatest="btn-comment-writable"
                                           icons={[{ name: 'text_fields', size: 32 }]}
                                           onclick={() => {
                                               actions.changeCommentMode({ type: CommentType.Writable });
                                               actions.closeMenuModal();
                                           }}>
                                {i18n.Menu.Buttons.WritableComment()}
                            </SettingButton>
                            : undefined}

                        {screen === Screens.Editor && comment !== CommentType.Readonly ?
                            <SettingButton key="btn-comment-readonly" href="#"
                                           datatest="btn-comment-readonly"
                                           icons={[{ name: 'lock_outline', size: 30 }]}
                                           enable={screen === Screens.Editor}
                                           onclick={screen === Screens.Editor ? () => {
                                               actions.changeCommentMode({ type: CommentType.Readonly });
                                               actions.closeMenuModal();
                                           } : () => {
                                               M.toast({
                                                   html: i18n.Menu.Messages.NoAvailableCommentButton(),
                                                   classes: 'top-toast',
                                                   displayLength: 3000,
                                               });
                                           }}>
                                {i18n.Menu.Buttons.ReadonlyComment()}
                            </SettingButton>
                            : undefined}

                        {/* <SettingButton key="btn-help" datatest="btn-help" href="./help.html"
                                       icons={[{ name: 'help_outline', size: 31.25 }]}>
                            {i18n.Menu.Buttons.Help()}
                        </SettingButton> */}

                        <SettingButton2 key="btn-zui-jp" datatest="btn-zui-jp" href="#"
                        onclick={() => {
                            actions.removeUnsettledItems();
                            clipboard('http://fumen.zui.jp/?')();
                        }}
                                       icons={[{ name: 'file_copy', size: 26 }]}>
                                           zui.jp
                        </SettingButton2>

                        <SettingButton2 key="btn-raw-fumen" datatest="btn-raw-fumen" href="#"
                        onclick={() => {
                            actions.removeUnsettledItems();
                            clipboard('')();
                        }}
                                       icons={[{ name: 'file_copy', size: 26 }]}>
                                           raw
                        </SettingButton2>

                        <div style={style({ height: px(10), width: '100%' })}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SettingButtonProps {
    href?: string;
    onclick?: (event: MouseEvent) => void;
    icons: { name: string, size: number }[];
    key: string;
    datatest: string;
    textSize?: number;
    enable?: boolean;
}

export const SettingButton: ComponentWithText<SettingButtonProps> = (
    { href = '#', key, onclick, icons, datatest, textSize = 13, enable = true }, showName,
) => {
    const iconsElements = icons.map(icon => (
        <Icon key={`${key}-icon-${icon.name}`} classNames={enable ? [] : ['disabled']} iconSize={icon.size}>
            {icon.name}
        </Icon>
    ));
    return <a key={key} href={href} onclick={onclick !== undefined ? (event: MouseEvent) => {
        onclick(event);
        event.stopPropagation();
        event.preventDefault();
    } : undefined}>
        <div key={`${key}-icon`} datatest={datatest}
             className={`z-depth-1 ${enable ? ' ' : 'disabled'}`}
             style={style({
                 width: px(50),
                 height: px(40),
                 lineHeight: px(40),
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: enable ? '#333' : '#bdbdbd',
                 margin: px(5),
                 border: `solid 1px ${enable ? '#999' : '#bdbdbd'}`,
                 boxSizing: 'border-box',
                 cursor: 'pointer',
             })}
        >
            {...iconsElements}
        </div>

        <div key={`${key}-text`}
             style={style({ textAlign: 'center', fontSize: px(textSize), color: enable ? '#333' : '#bdbdbd' })}>
            {showName}
        </div>
    </a>;
};

export const SettingButton2: ComponentWithText<SettingButtonProps> = (
    { href = '#', key, onclick, icons, datatest, textSize = 13, enable = true }, showName,
) => {
    const iconsElements = icons.map(icon => (
        <i key={`${key}-icon-${icon.name}`} className={`material-icons ${enable ? ' ' : 'disabled'}`}
           style={style({
               fontSize: px(icon.size),
               color: 'white'
           })}
        >
            {icon.name}
        </i>
    ));
    return <div>
        <a key={key} href={href} onclick={onclick !== undefined ? (event: MouseEvent) => {
            onclick(event);
            event.stopPropagation();
            event.preventDefault();
        } : undefined}>
            <div key={`${key}-icon`} datatest={datatest}
                className={`waves-effect ${enable ? ' ' : 'disabled'} teal`}
                style={style({
                    width: px(50),
                    height: px(40),
                    lineHeight: px(40),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: enable ? '#333' : '#bdbdbd',
                    margin: px(5),
                    // border: `solid 1px ${enable ? '#999' : '#bdbdbd'}`,
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    borderRadius: '2px'
                })}
            >
                {...iconsElements}
            </div>
        </a>
        <div key={`${key}-text`}
                style={style({ textAlign: 'center', fontSize: px(textSize), color: enable ? '#333' : '#bdbdbd' })}>
                {showName}
        </div>
    </div>;
};
