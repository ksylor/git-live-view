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
                <span className="commit-dot" aria-hidden="true"><svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg></span>
                {this.props.isRebaseOnto ? <span className="commit-rebase-onto-indicator"><svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path></svg></span>
                    : this.props.isRebasingCommit ? <span className="commit-rebase-indicator"><svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M313.553 392.331L209.587 504.334c-9.485 10.214-25.676 10.229-35.174 0L70.438 392.331C56.232 377.031 67.062 352 88.025 352H152V80H68.024a11.996 11.996 0 0 1-8.485-3.515l-56-56C-4.021 12.926 1.333 0 12.024 0H208c13.255 0 24 10.745 24 24v328h63.966c20.878 0 31.851 24.969 17.587 40.331z"></path></svg></span>
                        : ""}
                <span className="commit-truncate">{this.props.hash}</span>
                <span className="commit-line" aria-hidden="true"></span>
            </li>
        );
    }
}

export default Commit;