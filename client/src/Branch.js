import React, { Component } from 'react';
import Commit from './Commit';

class Branch extends Component {
    render() {
        const commits = this.props.history.map(({ sha, isAhead}) =>
            <Commit hash={sha} key={sha} isAhead={isAhead}/>
        );

        return (
            <div className="branch">
                <h4 className="branch-name">{this.props.branchName}</h4>
                <ul className="branch-commits">
                    {commits}
                </ul>
            </div>
        )
    }
}

export default Branch;