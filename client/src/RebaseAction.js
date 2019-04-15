import React, { Component } from 'react';

const statuses = {
    "p": "pick",
    "r": "reword",
    "e": "edit",
    "s": "squash",
    "f": "fixup",
    "x": "exec",
    "d": "drop"
};

const statusMessage = {
    "pick": "Keep this commit as-is",
    "reword": "Keep this commit, but edit commit message",
    "edit": "Edit this commit",
    "squash": "Merge this commit with previous and edit commit message",
    "fixup": "Merge this commit with previous, but discard commit message",
    "exec": "Run this command in the shell",
    "drop": "Remove this commit"
};

const statusIcon = {
    "pick": '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>',
    "reword": '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m448,0l-384,0c-35.3,0 -64,28.7 -64,64l0,288c0,35.3 28.7,64 64,64l96,0l0,84c0,7.1 5.8,12 12,12c2.4,0 4.9,-0.7 7.1,-2.4l124.9,-93.6l144,0c35.3,0 64,-28.7 64,-64l0,-288c0,-35.3 -28.7,-64 -64,-64zm16,352c0,8.8 -7.2,16 -16,16l-160,0l-12.8,9.6l-67.2,50.4l0,-60l-144,0c-8.8,0 -16,-7.2 -16,-16l0,-288c0,-8.8 7.2,-16 16,-16l384,0c8.8,0 16,7.2 16,16l0,288z" fill="currentColor"/><path d="m291.5898,110.90336l68.51225,68.51225l-148.77145,148.77145l-61.08412,6.74312c-8.17737,0.90443 -15.0864,-6.00994 -14.17661,-14.18731l6.79664,-61.12693l148.72329,-148.71259zm110.88689,-10.20031l-32.16897,-32.16897c-10.03441,-10.03441 -26.30888,-10.03441 -36.34328,0l-30.26377,30.26377l68.51225,68.51225l30.26377,-30.26377c10.03441,-10.03976 10.03441,-26.30888 0,-36.34328z" fill="currentColor" /></svg>',
    "edit": '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z" class=""></path></svg>',
    "squash": '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M313.553 392.331L209.587 504.334c-9.485 10.214-25.676 10.229-35.174 0L70.438 392.331C56.232 377.031 67.062 352 88.025 352H152V80H68.024a11.996 11.996 0 0 1-8.485-3.515l-56-56C-4.021 12.926 1.333 0 12.024 0H208c13.255 0 24 10.745 24 24v328h63.966c20.878 0 31.851 24.969 17.587 40.331z"></path></svg>',
    "fixup": '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M313.553 392.331L209.587 504.334c-9.485 10.214-25.676 10.229-35.174 0L70.438 392.331C56.232 377.031 67.062 352 88.025 352H152V80H68.024a11.996 11.996 0 0 1-8.485-3.515l-56-56C-4.021 12.926 1.333 0 12.024 0H208c13.255 0 24 10.745 24 24v328h63.966c20.878 0 31.851 24.969 17.587 40.331z"></path></svg>',
    "exec": '<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M255.03 261.65c6.25 6.25 16.38 6.25 22.63 0l11.31-11.31c6.25-6.25 6.25-16.38 0-22.63L253.25 192l35.71-35.72c6.25-6.25 6.25-16.38 0-22.63l-11.31-11.31c-6.25-6.25-16.38-6.25-22.63 0l-58.34 58.34c-6.25 6.25-6.25 16.38 0 22.63l58.35 58.34zm96.01-11.3l11.31 11.31c6.25 6.25 16.38 6.25 22.63 0l58.34-58.34c6.25-6.25 6.25-16.38 0-22.63l-58.34-58.34c-6.25-6.25-16.38-6.25-22.63 0l-11.31 11.31c-6.25 6.25-6.25 16.38 0 22.63L386.75 192l-35.71 35.72c-6.25 6.25-6.25 16.38 0 22.63zM624 416H381.54c-.74 19.81-14.71 32-32.74 32H288c-18.69 0-33.02-17.47-32.77-32H16c-8.8 0-16 7.2-16 16v16c0 35.2 28.8 64 64 64h512c35.2 0 64-28.8 64-64v-16c0-8.8-7.2-16-16-16zM576 48c0-26.4-21.6-48-48-48H112C85.6 0 64 21.6 64 48v336h512V48zm-64 272H128V64h384v256z" class=""></path></svg>',
    "drop": '<svg aria-hidden="true" focusable="false"role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z" class=""></path></svg>'
};

class RebaseAction extends Component {

    getType(action) {
        if (action.length === 1) {
            return statuses[action];
        }
        return action;
    }

    render() {
        let action = this.getType(this.props.action);
        return [
            <span className={"commit-rebase-indicator " + action} dangerouslySetInnerHTML={{__html: statusIcon[action]}}></span>,
            <span className="tooltip">{statusMessage[action]}</span>
        ];
    }
}

export default RebaseAction;