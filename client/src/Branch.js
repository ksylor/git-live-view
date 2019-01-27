import React, { Component } from 'react';
import Commit from './Commit';

class Branch extends Component {
    render() {
        const commits = this.props.history.map((hash) =>
            <Commit hash={hash} key={hash}/>
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