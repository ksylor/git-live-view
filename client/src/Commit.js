import React, { Component } from 'react';
import RebaseAction from './RebaseAction';

class Commit extends Component {
    getClassNames() {
        let classes = ["commit"];
        if (this.props.isAhead) {
            classes.push("commit-is-ahead");
        }
        if (this.props.isRebasingCommit) {
            classes.push("commit-is-rebasing");
            classes.push("has-tooltip");
        }
        if (this.props.isRebaseOnto) {
            classes.push("has-tooltip");
        }
        return  classes.join(" ");
    }

    render() {
        return (
            <li className={this.getClassNames()}
                id={this.props.isRebaseOnto ? "rebase-onto" : undefined }
            >
                <span className="commit-dot" aria-hidden="true"><svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg></span>
                {this.props.isRebasingCommit ? <RebaseAction action={this.props.rebaseAction}/> :""}
                {this.props.isRebaseOnto ? [ <span className="commit-rebase-indicator"><svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path></svg></span>,
                    <span className="tooltip wide">Rebase will be re-played on top of this commit</span>]
                    : ""}
                <span className="commit-truncate">{this.props.hash}</span>
                <span className="commit-line" aria-hidden="true"></span>
                {this.props.isHead ? <span className="tag head">HEAD</span>:""}
            </li>
        );
    }
}

export default Commit;