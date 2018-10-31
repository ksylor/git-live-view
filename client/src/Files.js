import React, { Component } from 'react';
import File from './File';

class Files extends Component {
    render() {
        return (
            <ul className="files">
                <File path="path/to/file" />
                <File path="another/file" />
                <File path="whee" />
            </ul>
        )
    }
}

export default Files;