import React, { Component } from 'react';
import Branch from './Branch';

class MultiBranch extends Component {
    constructor(props) {
        super(props);
        this.multiBranches = React.createRef();
        this.timeout = false;
    }

    componentDidMount() {
        this.lines();
        this.resizeListen(this.timeout);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.lines();
    }

    resizeListen(timeout) {
        window.addEventListener('resize', function() {
            // clear the timeout
            clearTimeout(timeout);
            // start timing for event "completion"
            timeout = setTimeout(this.lines.bind(this), 250);
        }.bind(this));
    }

    lines() {
        let multiBranchWrapper = this.multiBranches.current;
        let multiBranches = multiBranchWrapper.firstChild;
        let mergedBranch = multiBranchWrapper.lastChild;
        // assume there are only two branches in multi-branch
        // get the last commit item for the first multi-branch
        let b1 = multiBranches.firstChild.querySelector(".commit:last-child");
        // get the last commit item for the second multi-branch
        let b2 = multiBranches.lastChild.querySelector(".commit:last-child");

        // get the first commit item for the merged branch
        let mb = mergedBranch.querySelector(".commit:first-of-type");
        let mbdot = mb.getElementsByClassName("commit-dot")[0].getBoundingClientRect();
        let mbx = mbdot.x + mbdot.width/2;
        let mby = mbdot.y + mbdot.height/2;


        let b1line = b1.getElementsByClassName("commit-line")[0];
        b1line.classList.remove("commit-line");
        b1line.classList.add("commit-line-angled");
        let b1dot = b1.getElementsByClassName("commit-dot")[0].getBoundingClientRect();
        let b1x = b1dot.x + b1dot.width/2;
        let b1y = b1dot.y + b1dot.height/2;

        let b1boxx = mbx - b1x;
        let b1boxy = mby - b1y;

        let b1svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${b1boxx} ${b1boxy}" height="${b1boxy}" width="${b1boxx}">
                <line x1="0" y1="0" x2="${b1boxx}" y2="${b1boxy}" />
            </svg>`;

        b1line.innerHTML = b1svg;

        // b2 needs to be opposite b1 to draw it right :(
        let b2line = b2.getElementsByClassName("commit-line")[0];
        b2line.classList.remove("commit-line");
        b2line.classList.add("commit-line-angled");

        let b2dot = b2.getElementsByClassName("commit-dot")[0].getBoundingClientRect();
        let b2x = b2dot.x + b2dot.width/2;
        let b2y = b2dot.y + b2dot.height/2;

        let b2boxx = b2x - mbx;
        let b2boxy = mby - b2y;

        let b2svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${b2boxx} ${b2boxy}" height="${b2boxy}" width="${b2boxx}">
                <line x1="${b2boxx}" y1="0" x2="0" y2="${b1boxy}" />
            </svg>`;

        b2line.innerHTML = b2svg;
        b2line.style.left = `${-b2boxx + 7}px`; // 7px is half the width of the dot
    }

    render() {
        const branches = this.props.branches.map(({ branchName, history }) =>
            <Branch branchName={branchName} history={history} key={branchName}/>
        );

        return (
            <div className="multi-branch-wrap" ref={this.multiBranches}>
                <div className="multi-branch">
                    {branches}
                </div>
                <Branch branchName={null} history={this.props.merged} />
            </div>
        )
    }
}

export default MultiBranch;