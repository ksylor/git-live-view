import React, { Component } from 'react';

class Enviro extends Component {
    render() {
        let classy = "enviro " + this.props.type;
        return (
            <div className={classy}>
                <h2 className="enviro-title">{this.props.title}</h2>
                <div className="subs">
                    {this.props.children}
                </div>
            </div>
        )
    }
}

export default Enviro;