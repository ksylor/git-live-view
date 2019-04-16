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
                <span>
                    <svg className="file-icon"aria-hidden="true" focusable="false" role="img"
                         xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor"
                                                                                d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48z"
                                                                                className=""></path></svg>
                    {this.props.path}
                </span>
                {statuses}
            </li>
        )
    }
}

export default File;