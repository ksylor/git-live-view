import React, { Component } from 'react';
import Branch from './Branch';

class MultiBranch extends Component {
    constructor(props) {
        super(props);
        this.multiBranches = React.createRef();
        this.timeout = false;
    }

    componentDidMount() {
        // wait to make sure that everything is rendered
        setTimeout(this.drawConnectionLines.bind(this), 300);
        // listen for resize event
        this.resizeListen(this.timeout);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // wait to make sure that everything is rendered
        setTimeout(this.drawConnectionLines.bind(this), 300);
    }

    resizeListen(timeout) {
        window.addEventListener('resize', function() {
            // clear the timeout
            clearTimeout(timeout);
            // start timing for event "completion"
            timeout = setTimeout(this.drawConnectionLines.bind(this), 10);
        }.bind(this));
    }

    getDotPosition(commitEl) {
        let dotpos = commitEl.getElementsByClassName("commit-dot")[0].getBoundingClientRect();
        let x = dotpos.x + dotpos.width/2;
        let y = dotpos.y + dotpos.height/2;
        return { x, y };
    }

    drawRebaseLine() {
        let multiBranchWrapper = this.multiBranches.current;
        let b1El = multiBranchWrapper.querySelector("#b1");
        let b2El = multiBranchWrapper.querySelector("b2");

        let b1pos = b1El.getBoundingClientRect();
        let b2pos = b2El.getBoundingClientRect();

        let b2startx = b2pos.x;
        let b2starty = b2pos.y + b2pos.height/2;

        let b1endx = b1pos.x + b1pos.width;
        let b1endy = b1pos.y + b2pos.height/2;

        let boxx = b2startx - b1endx;
        let boxy = Math.abs(b2starty - b1endy);

        let svg = `<svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 ${boxx} ${boxy}" height="${boxy}" width="${boxx}">
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#f00" />
                </marker>
            </defs>
            <line x1="0" y1="0" x2="${boxx}" y2="${boxy}" marker-end="url(#arrow)" />
        </svg>`;

        let wrap = document.createElement("div").setAttribute("class", "rebase-line");
        wrap.innerHTML = svg;
        b1El.appendChild(wrap);
    }

    drawConnectionLines() {
        let multiBranchWrapper = this.multiBranches.current;

        // get the last commit item for b1
        let b1El = multiBranchWrapper.querySelector("#b1 .commit:last-child");
        // get the last commit item for b2
        let b2El = multiBranchWrapper.querySelector("#b2 .commit:last-child");
        // get the first commit item for the merged branch
        let mbEl = multiBranchWrapper.querySelector("#mb .commit:first-child");

        // get the merged branch's dot position
        let mb = this.getDotPosition(mbEl);

        // get the first branch's line
        let b1line = b1El.getElementsByClassName("commit-line")[0];
        b1line.classList.add("commit-line-angled");

        // get the first branch's commit dot position
        let b1 = this.getDotPosition(b1El);

        // calculate line box height & width
        let b1boxx = mb.x - b1.x;
        let b1boxy = mb.y - b1.y;

        let b1svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${b1boxx} ${b1boxy}" height="${b1boxy}" width="${b1boxx}">
                <line x1="0" y1="0" x2="${b1boxx}" y2="${b1boxy}" />
            </svg>`;

        b1line.innerHTML = b1svg;

        // b2 needs different output & logic so can't easily merge this with b1
        let b2line = b2El.getElementsByClassName("commit-line")[0];
        b2line.classList.add("commit-line-angled");

        let b2 = this.getDotPosition(b2El);

        let b2boxx = b2.x - mb.x;
        let b2boxy = mb.y - b2.y;

        let b2svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${b2boxx} ${b2boxy}" height="${b2boxy}" width="${b2boxx}">
                <line x1="${b2boxx}" y1="0" x2="0" y2="${b1boxy}" />
            </svg>`;

        b2line.innerHTML = b2svg;
        // add extra left positioning to get it centered
        b2line.style.left = `${-b2boxx + 7}px`; // 7px is half the width of the dot

        // bleeeehhh this is too complicated :(
        // if (this.props.rebaseInProgress) {
        //     this.drawRebaseLine();
        // }
    }

    render() {
        return (
            <div className="multi-branch-wrap" ref={this.multiBranches}>
                <div className="multi-branch">
                    <Branch
                        branchName={this.props.branches[0].branchName}
                        history={this.props.branches[0].history}
                        id="b1"
                    />
                    <Branch
                        branchName={this.props.branches[1].branchName}
                        history={this.props.branches[1].history}
                        id="b2"
                    />
                </div>
                <Branch
                    branchName={null}
                    history={this.props.merged}
                    id="mb"
                />
            </div>
        )
    }
}

export default MultiBranch;