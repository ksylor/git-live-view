import React, { Component } from 'react';

class Commit extends Component {
    render() {
        return (
            <li className="commit">
                <span className="commit-truncate">{this.props.hash}</span>
            </li>
        );
    }
}

export default Commit;