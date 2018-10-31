import React, { Component } from 'react';

class File extends Component {
    render() {
        return (
            <li className="file">{this.props.path}</li>
        )
    }
}

export default File;