import React, { Component } from 'react';
import Commit from './Commit';

class Branch extends Component {
    render() {
        return (
            <ul className="branch">
                <Commit hash="12345" />
                <Commit hash="23456" />
                <Commit hash="34567" />
            </ul>
        )
    }
}

export default Branch;