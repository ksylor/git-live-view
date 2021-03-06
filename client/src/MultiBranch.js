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
        this.timeout = setTimeout(this.drawConnectionLines.bind(this), 100);

        this.boundListener = this.resizeListen.bind(this);
        // listen for resize event
        window.addEventListener('resize', this.boundListener);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // wait to make sure that everything is rendered
        this.timeout = setTimeout(this.drawConnectionLines.bind(this), 100);
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
        window.removeEventListener("resize", this.boundListener);
    }

    resizeListen() {
        // clear the timeout
        clearTimeout(this.timeout);
        // re-draw connection lines
        this.timeout = setTimeout(this.drawConnectionLines.bind(this), 10);
    }

    getDotPosition(commitEl) {
        let dotpos = commitEl.getElementsByClassName("commit-dot")[0].getBoundingClientRect();
        let x = dotpos.x + dotpos.width/2;
        let y = dotpos.y + dotpos.height/2;
        return { x, y };
    }

    drawConnectionLines() {
        let multiBranchWrapper = this.multiBranches.current;
        if (!multiBranchWrapper) multiBranchWrapper = document.getElementById("multi-branch-wrap");

        // get lsat commit for optional mergedbranchstart
        let smbEl = multiBranchWrapper.querySelector("#mbstart .commit:last-child");
        // get the last commit item for b1
        let b1El = multiBranchWrapper.querySelector("#b1 .commit:last-child");
        // get the last commit item for b2
        let b2El = multiBranchWrapper.querySelector("#b2 .commit:last-child");
        // get the first commit item for the merged branch
        let mbEl = multiBranchWrapper.querySelector("#mb .commit:first-child");

        // get the merged branch's dot position
        let mb = this.getDotPosition(mbEl);

        if (b1El) {
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
        }

        if (b2El) {
            // b2 needs different output & logic so can't easily merge this with b1
            let b2line = b2El.getElementsByClassName("commit-line")[0];
            b2line.classList.add("commit-line-angled");

            let b2 = this.getDotPosition(b2El);

            let b2boxx = b2.x - mb.x;
            let b2boxy = mb.y - b2.y;

            let b2svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${b2boxx} ${b2boxy}" height="${b2boxy}" width="${b2boxx}">
                <line x1="${b2boxx}" y1="0" x2="0" y2="${b2boxy}" />
            </svg>`;

            b2line.innerHTML = b2svg;
            // add extra left positioning to get it centered
            b2line.style.left = `${-b2boxx + 6}px`; // 6px is half the width of the dot
        }

        if (smbEl) {
            let lines = smbEl.getElementsByClassName("commit-line");
            let l1 = lines[0] || smbEl.appendChild(document.createElement("span"));
            let l2 = lines[1] || smbEl.appendChild(document.createElement("span"));
            l1.setAttribute("class", "commit-line commit-line-angled first");
            l2.setAttribute("class", "commit-line commit-line-angled second");

            // assume that there is def a b1 and b2
            // get first children of branches
            b1El = multiBranchWrapper.querySelector("#b1 .commit:first-child");
            // get the last commit item for b2
            b2El = multiBranchWrapper.querySelector("#b2 .commit:first-child");
            let smb = this.getDotPosition(smbEl);
            let b1 = this.getDotPosition(b1El);
            let b2 = this.getDotPosition(b2El);

            let l1x = smb.x - b1.x;
            let l1y = b1.y - smb.y;

            let l1svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${l1x} ${l1y}" height="${l1y}" width="${l1x}">
                <line x1="0" y1="${l1y}" x2="${l1x}" y2="0" />
            </svg>`;

            let l2x = b2.x - smb.x;
            let l2y = b2.y - smb.y;

            let l2svg = `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 ${l2x} ${l2y}" height="${l2y}" width="${l2x}">
                <line x1="0" y1="0" x2="${l2x}" y2="${l2y}" />
            </svg>`;

            l1.innerHTML = l1svg;
            l1.style.left = `${-l1x + 6}px`;
            l2.innerHTML = l2svg;

            smbEl.appendChild(l1);
            smbEl.appendChild(l2);
        }
    }

    render() {
        return (
            <div className="multi-branch-wrap" ref={this.multiBranches} id="multi-branch-wrap">
                { this.props.mergedStart ?
                    <Branch
                        branchName={this.props.mergedStart.branchName}
                        history={this.props.mergedStart.history}
                        id="mbstart"
                    /> : ""
                }
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
                    history={this.props.mergedEnd.history}
                    id="mb"
                />
            </div>
        )
    }
}

export default MultiBranch;