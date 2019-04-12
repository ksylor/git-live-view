import React, { Component } from 'react';

class Commit extends Component {
    getClassNames() {
        let classes = ["commit"];
        if (this.props.isAhead) {
            classes.push("commit-is-ahead");
        }
        if (this.props.isRebasingCommit) {
            classes.push("commit-is-rebasing");
        }
        return  classes.join(" ");
    }

    getTooltip() {

    }

    render() {
        return (
            <li className={this.getClassNames()}
                id={this.props.isRebaseOnto ? "rebase-onto" : false}
                {...(this.props.isRebaseOnto
                    ? { "data-tooltip": "this is the commit your rebase will be re-played onto" }
                    : this.props.isRebasingCommit
                        ? { "data-tooltip": "this commit is included in your rebase"}
                        : false)}
            >
                <span className="commit-truncate">{this.props.hash}</span>
                {/*{ this.props.isRebasingCommit*/}
                {/*    ? <span className="tag">{this.props.rebaseAction}</span> : "" }*/}
            </li>
        );
    }
}

export default Commit;