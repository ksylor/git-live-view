import React, { Component } from 'react';
import Enviro from './Enviro';
import SubEnviro from './SubEnviro';
import Branch from './Branch';
import Files from './Files';
import './App.scss';

class App extends Component {
    state = {
        status: ''
    };

    componentDidMount() {
        this.callApi()
            .then(res => this.setState({ status: res.express }))
            .catch(err => console.log(err));
    }

    callApi = async () => {
        const response = await fetch('/api/status');
        const body = await response.json();

        if (response.status !== 200) throw Error(body.message);

        return body;
    };

    render() {
        return (
          <div className="wrapper">
              <Enviro title="Github" type="hub">
                  <SubEnviro title="Remote" type="remote">
                      <Branch />
                  </SubEnviro>
              </Enviro>
              <Enviro title="Your Machine" type="machine">
                  <SubEnviro title="Local" type="local">
                      <Branch />
                  </SubEnviro>
                  <SubEnviro title="Index" type="index">
                      <Files />
                  </SubEnviro>
                  <SubEnviro title="Workspace" type="work">
                      <Files />
                  </SubEnviro>
              </Enviro>
          </div>
        );
    }
}

export default App;
