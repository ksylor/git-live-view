import React, { Component } from 'react';
import io from 'socket.io-client';
import Settings from './Settings';
import Enviro from './Enviro';
import SubEnviro from './SubEnviro';
import Branch from './Branch';
import Files from './Files';
import './css/App.scss';
import MultiBranch from './MultiBranch';

class App extends Component {
    constructor (props) {
        super(props);

        this.state = {
            data: undefined,
            settingsIsOpen: false,
        };

        this.socket = io('localhost:5000');

        this.socket.on('UPDATE', function (data) {
            update(data);
        });

        const update = data => {
            console.log(data);
            this.setState({data: data});
        };

        this.onSettingsChange = function(settings) {
            this.setState({settingsIsOpen: false});
            console.log(settings);
            this.socket.emit('UPDATE_SETTINGS', settings);
        };
    }

    getNoRemoteMessage(type, branchName) {
        if (type === "MSG_UNTRACKED_REMOTE") {
            return (
                <div className="no-remote">
                    <p>Local and remote branches with the same name are not associated with each other. Run the following command to set up the remote tracking branch:</p>
                    <code>{`git branch --set-upstream-to=origin/${branchName} ${branchName}`}</code>
                </div>
            );
        }

        if (type === "MSG_NO_REMOTE") {
            return (
                <div className="no-remote">
                    <p>This branch doesn't have a remote tracking branch associated with it. Run the following command to push up the branch and set up the remote tracking branch:</p>
                    <code>{`git push -u origin ${branchName}`}</code>
                </div>
            );
        }

        if (type === "MSG_REMOTE_IS_A_LIE") {
            return (
                <div className="no-remote lies">
                    <img src="lie.jpg" alt="the cake is a lie"/>
                    <h2>The remote<br />is a lie</h2>
                </div>
            )
        }
    }

    toggleSettings() {
        let current = this.state.settingsIsOpen;
        this.setState({ settingsIsOpen: !current });
    }

    render() {
        if (!this.state.data) {
            return (
                <div>Loading...</div>
            )
        }

        return (
          <div className="wrapper">
              <button className="settings-button" type="button" onClick={this.toggleSettings.bind(this)} aria-label="Change View Settings">
                  <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="cog" role="img"
                       xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
                       className="svg-inline--fa fa-cog fa-w-16 fa-lg">
                      <path fill="currentColor"
                            d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"
                            className=""></path>
                  </svg>
              </button>

              <Settings isOpen={this.state.settingsIsOpen} settings={this.state.data.settings} onSettingsChange={this.onSettingsChange.bind(this)} />

              { this.state.data.rebaseInProgress ?
                  <div className="notice"><h2>Rebase in progress</h2></div> : "" }

              { this.state.data.mergeInProgress ?
                  <div className="notice"><h2>Merge in progress</h2></div> : "" }

              { this.state.data.isDetached ?
                  <div className="notice"><p><strong>Detached HEAD!</strong> Don't panic, you can either just checkout an existing branch, or run <code>git checkout -b branch_name</code> to create a new branch from this point.</p></div> : ""}

              <Enviro title="Github" type="hub">
                  <SubEnviro title="Remote" type="remote">
                      { this.state.data.remote.msg
                          ? this.getNoRemoteMessage(this.state.data.remote.msg, this.state.data.remote.branchName)
                          : this.state.data.remote.isMultiBranch
                          ? <MultiBranch {...this.state.data.remote} />
                          : <Branch {...this.state.data.remote} /> }
                  </SubEnviro>
              </Enviro>
              <Enviro title="Your Machine" type="machine">
                  <SubEnviro title="Local" type="local">
                      { this.state.data.local.isMultiBranch === true
                        ? <MultiBranch {...this.state.data.local} />
                        : <Branch {...this.state.data.local} />
                      }
                  </SubEnviro>
                  <SubEnviro title="Index/Staging" type="index">
                      <Files list={this.state.data.index} />
                  </SubEnviro>
                  <SubEnviro title="Workspace" type="workspace">
                      <Files list={this.state.data.workspace} />
                  </SubEnviro>
              </Enviro>
          </div>
        );
    }
}

export default App;
