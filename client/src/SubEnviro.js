import React, { Component } from 'react';

class SubEnviro extends Component {
    render() {
        let classy="sub-enviro " + this.props.type;
        return (
            <div className={classy}>
                <h3>{this.props.title}</h3>
                {this.props.children}
            </div>
        )
    }
}

export default SubEnviro;