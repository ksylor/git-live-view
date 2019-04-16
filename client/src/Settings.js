import React, { Component } from 'react';
import equal from 'deep-equal';

class Settings extends Component {
    constructor(props) {
        super(props);

        this.state = {
            form: { ...props.settings },
            updating: false,
            isOpen: props.isOpen,
        };
    }

    componentDidUpdate(prevProps) {
        if (!equal(prevProps.settings, this.props.settings)) {
            console.log('settings updated from server');
            this.setState({
                updating: false,
                form: { ...this.props.settings },
            });
        }
        if (this.props.isOpen !== prevProps.isOpen) {
            this.setState({ isOpen: this.props.isOpen });
        }
    }

    render() {
        let { showWithMaster, commitsToDisplay, mergedHistoryLength, showHead, showMerges } = this.state.form;
        let update = this.updateSetting.bind(this);
        let ariaHidden = this.state.isOpen === false;

        if (this.state.updating) {
            return <div className="settings-form">Updating ...</div>;
        }

        return (
            <form onSubmit={this.applySettings.bind(this)} className="settings-form" aria-hidden={ariaHidden}>
                <fieldset>
                    <legend>Change view settings</legend>
                    <label>
                        <input type="checkbox" id="showWithMaster" checked={showWithMaster} onChange={update} />
                        Show with master
                    </label>

                    <label>
                        <input type="checkbox" id="showMerges" checked={showMerges} onChange={update} />
                        Show merges
                    </label>

                    <label>
                        <input type="checkbox" id="showHead" checked={showHead} onChange={update} />
                        Show HEAD
                    </label>

                    <label>
                        Commits to display:&nbsp;
                        <input id="commitsToDisplay" size="3" value={commitsToDisplay} onChange={update} />
                    </label>

                    <label>
                        Merged history length:&nbsp;
                        <input id="mergedHistoryLength" size="3" value={mergedHistoryLength} onChange={update} />
                    </label>

                </fieldset>

                <button type="submit" disabled={!this.haveSettingsChanged()}>Apply</button>
            </form>
        );
    }

    applySettings() {
        this.props.onSettingsChange(this.state.form);
        this.setState({ updating: true });
    }

    updateSetting(e) {
        let el = e.target;
        let key = el.id;
        let val;

        if (el.getAttribute('type') === 'checkbox') {
            val = el.checked;
        } else {
            // assuming all other settings are a number for now
            val = +el.value;
        }

        this.setState(state => ({
            form: {
                ...state.form,
                [key]: val,
            }
        }));
    }

    haveSettingsChanged() {
        return !equal(this.props.settings, this.state.form);
    }
}

export default Settings;