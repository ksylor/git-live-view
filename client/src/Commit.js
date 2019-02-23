import React, { Component } from 'react';

class Commit extends Component {
    render() {
        const isAheadClass = this.props.isAhead ? "commit commit-is-ahead" : "commit";
        return (
            <li className={isAheadClass}>
                <span className="commit-truncate">{this.props.hash}</span>
            </li>
        );
    }
}

export default Commit;