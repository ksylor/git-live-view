import React, { Component } from 'react';

class File extends Component {

    render() {
        // possible statuses are new, modified, deleted, renamed, typechange, ignored, conflicted
        // there should only be one status per file per environment
        // but lib2git returns an array so being super safe here.
        const statuses = this.props.status.map((status) => {
            var stat = status.toLowerCase();
            return (
                <span className="tag" key={stat}>
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