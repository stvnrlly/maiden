import React, { Component } from 'react';
import { decorators, Treebeard } from 'react-treebeard';
import cx from 'classname';
import treeStyle from './explorer-style';
import treeAnim from './explorer-animation';
import './explorer.css';

import ModalContent from './modal-content';
import IconButton from './icon-button';
import { ICONS } from './svg-icons';


const TreeHeader = (props) => {
    let className = cx('explorer-entry', 'noselect', {'dirty': props.node.modified}, {'active': props.node.active});
    // console.log(props.node, className)
    return (
        <span className={className}>
        {props.node.name}
        </span>
    );
};

const TreeToggle = ({style}) => {
    const {height, width} = style;
    const midHeight = height * 0.5;
    const points = `0,0 0,${height} ${width},${midHeight}`;

    return (
        <span style={style.base}>
            <svg height={height} width={width}>
                <polygon points={points} style={style.arrow} />
            </svg>
        </span>
    );
};

const explorerDecorators = {
    ...decorators,
    Header: TreeHeader,
    Toggle: TreeToggle,
};

// TODO: turn this in a containing component called Section so that individual sections can be collapsed and expanded
const SectionHeader = (props) => {
    let tools = props.tools.map(tool => {
        return (
            <IconButton
                key={tool.name}
                action={() => props.buttonAction(tool.name)}
                icon={tool.icon}
                size="12"
                padding="1"
                color="#e4e4e4"
            />
        );
    });

    return (
        <div className='explorer-header'>
            <span className='section-name'>{props.name}</span>
            <span 
                className={cx('section-tools', {'opaque': props.showTools})}
            >
                {tools}
            </span>
        </div>
    );
}

const scriptTools = [
    {
        name: "add",
        icon: ICONS["plus"],
    },
    {
        name: "remove",
        icon: ICONS["minus"],
    },
    {
        name: "duplicate",
        icon: ICONS["copy"],
    },
    {
        name: "new-folder",
        icon: ICONS["folder-plus"],
    }
]
class Explorer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showTools: false,
        };
        this.activeNode = undefined;
    }

    componentDidMount() {
        this.explorer.onmouseenter = (e) => {
            this.setState({
                showTools: true,
            })
        }
        this.explorer.onmouseleave = (e) => {
            this.setState({
                showTools: false,
            })
        }
    }

    onToggle = (node, toggled) => {
        if (node.children) {
            this.props.explorerToggleNode(node, toggled)
            if (toggled) {
                this.props.scriptDirRead(this.props.api, node.url);
            }
        } else {
            this.props.scriptSelect(node.url);
            // FIXME: there is a risk that this gets out of sync if something else calls scriptSelect, ideally we should lookup the node associated w/ the url in the listing during reduction and pass that back in here via props
            this.activeNode = node;
        }
    }

    onScriptToolClick = (name) => {
        switch (name) {
        case 'add':
            this.props.scriptCreate(this.props.activeBuffer)
            break;
        
        case 'duplicate':
            this.props.scriptDuplicate(this.props.activeBuffer)
            break;

        case 'remove':
            this.handleRemove()
            break;

        default:
            console.log(name)
            break;
        }
    }

    handleRemove = () => {
        let removeModalCompletion = (choice) => {
            console.log('remove:', choice)
            if (choice === 'ok') {
                this.props.scriptDelete(this.props.api, this.props.activeBuffer)
            }
            this.props.hideModal()
        }

        let content = (
            <ModalContent
                message={`Delete "${this.activeNode.name}"?`}
                supporting={"This operation cannot be undone."}
                buttonAction={removeModalCompletion}
            />
        )

        this.props.showModal(content)
    }

    render() {
        const {width, height} = this.props;
        return (
            <div className={'explorer' + (this.props.hidden ? ' hidden' : '')}
                 style={{width, height}}
                 ref={(elem) => this.explorer = elem}
            >
                <SectionHeader 
                    name='scripts'
                    tools={scriptTools}
                    buttonAction={this.onScriptToolClick}
                    showTools={this.state.showTools}
                />
                <Treebeard
                    style={treeStyle}
                    animations={treeAnim}
                    data={this.props.data}
                    onToggle={this.onToggle}
                    decorators={explorerDecorators}
                />
            </div>
        );
    }
}

export default Explorer;
