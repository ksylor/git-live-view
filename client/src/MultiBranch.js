import React, { Component } from 'react';
import Branch from './Branch';

class MultiBranch extends Component {
    render() {
        const branches = this.props.branches.map(({ branchName, history }) =>
            <Branch branchName={branchName} history={history} />
        );

        return (
            <div className="multi-branch-wrap">
                <div className="multi-branch">
                    {branches}
                </div>
                <Branch branchName={null} history={this.props.merged} />
            </div>
        )
    }
}

export default MultiBranch;