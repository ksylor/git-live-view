import React, { Component } from 'react';

class Commit extends Component {
    render() {
        return (
            <li className="commit">{this.props.hash}</li>
        )
    }
}

export default Commit;