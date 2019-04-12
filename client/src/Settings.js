import React, { Component } from 'react';
import equal from 'deep-equal';

class Settings extends Component {
    constructor(props) {
        super(props);

        this.state = {
            form: { ...props.settings },
            updating: false,
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
    }

    render() {
        let { showWithMaster, commitsToDisplay, mergedHistoryLength } = this.state.form;
        let update = this.updateSetting.bind(this);

        if (this.state.updating) {
            return <div>Updating ...</div>;
        }

        return (
            <div>
                <div>
                    <label>
                        <input type="checkbox" id="showWithMaster" checked={showWithMaster} onChange={update} />
                        Show with master
                    </label>
                </div>

                <div>
                    <label>
                        Commits to display:&nbsp;
                        <input id="commitsToDisplay" size="3" value={commitsToDisplay} onChange={update} />
                    </label>
                </div>

                <div>
                    <label>
                        Merged history length:&nbsp;
                        <input id="mergedHistoryLength" size="3" value={mergedHistoryLength} onChange={update} />
                    </label>
                </div>

                <button disabled={!this.haveSettingsChanged()} onClick={this.applySettings.bind(this)}>Apply</button>
            </div>
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