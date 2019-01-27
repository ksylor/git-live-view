import React, { Component } from 'react';
import File from './File';

class Files extends Component {
    render() {
        if (this.props.list.length === 0) {
            return null;
        }

        const files = this.props.list.map((file) =>
            <File {...file} key={file.path} />
        );

        return (
            <ul className="files">
                {files}
            </ul>
        )
    }
}

export default Files;