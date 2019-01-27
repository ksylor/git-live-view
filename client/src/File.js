import React, { Component } from 'react';

class File extends Component {

    render() {
        // possible statuses are new, modified, deleted, renamed, typechange, ignored
        // there should only be one status per file per environment
        // but lib2git returns an array so being super safe here.
        const statuses = this.props.status.map((status) => {
            var stat = status.split("_")[1].toLowerCase();
            return (
                <span className="file-status">
                    {stat}
                </span>
            );
        });

        return (
            <li className="file">
                {this.props.path}
                {statuses}
            </li>
        )
    }
}

export default File;