import React, { Component } from 'react';
import Commit from './Commit';

class Branch extends Component {
    render() {
        const commits = this.props.history.map(({ sha, isAhead, isHead, isRebasingCommit, rebaseAction, isRebaseOnto }) =>
            <Commit
                hash={sha}
                key={sha}
                isAhead={isAhead}
                isRebasingCommit={isRebasingCommit}
                rebaseAction={rebaseAction}
                isRebaseOnto={isRebaseOnto}
                isHead={isHead}
            />
        );

        return (
            <div className="branch">
                {this.props.branchName ? <h4 className="branch-name">{this.props.branchName}</h4> : ""}
                {this.props.history.length > 0 ?
                    <ul className="branch-commits" id={this.props.id}>
                        {commits}
                    </ul>
                    : ""}
            </div>
        )
    }
}

export default Branch;