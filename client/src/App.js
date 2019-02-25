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

    // componentDidMount() {
    //     this.callApi()
    //         .then(res => {
    //             this.setState({ 'data': res });
    //         })
    //         .catch(err => console.log(err));
    //
    //
    // }
    //
    // callApi = async () => {
    //     const response = await fetch('/api/status');
    //     const body = await response.json();
    //
    //     //if (response.status !== 200) throw Error(body.message);
    //
    //     return body;
    // };

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
                      <Branch {...this.state.data.branches.remote} />
                  </SubEnviro>
              </Enviro>
              <Enviro title="Your Machine" type="machine">
                  <SubEnviro title="Local" type="local">
                      <Branch {...this.state.data.branches.local} />
                  </SubEnviro>
                  <SubEnviro title="Index" type="index">
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
