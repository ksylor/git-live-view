import React, { Component } from 'react';
import io from 'socket.io-client';
import Enviro from './Enviro';
import SubEnviro from './SubEnviro';
import Branch from './Branch';
import Files from './Files';
import './App.scss';

class App extends Component {
    constructor (props) {
        super(props);

        this.state = {
            data: undefined
        };

        this.socket = io('localhost:5000');

        this.socket.on('UPDATE', function (data) {
            update(data);
        });

        const update = data => {
            console.log(data);
            this.setState({data: data});
        }
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
    }

    render() {
        if (!this.state.data) {
            return (
                <div>Loading...</div>
            )
        }

        return (
          <div className="wrapper">
              <Enviro title="Github" type="hub">
                  <SubEnviro title="Remote" type="remote">
                      { this.state.data.branches.remote.msg
                          ? <p className="no-upstream">{this.getNoRemoteMessage(this.state.data.branches.remote.msg, this.state.data.branches.local.branchName)}</p>
                          : <Branch {...this.state.data.branches.remote} /> }
                  </SubEnviro>
              </Enviro>
              <Enviro title="Your Machine" type="machine">
                  <SubEnviro title="Local" type="local">
                      <Branch {...this.state.data.branches.local} />
                  </SubEnviro>
                  <SubEnviro title="Index/Staging" type="index">
                      <Files list={this.state.data.files.index} />
                  </SubEnviro>
                  <SubEnviro title="Workspace" type="work">
                      <Files list={this.state.data.files.workspace} />
                  </SubEnviro>
              </Enviro>
          </div>
        );
    }
}

export default App;
