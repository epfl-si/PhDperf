import {Meteor} from "meteor/meteor";
import React from "react";
import toast from 'react-hot-toast';

const notify = (message: string) => toast(message);

type WorkflowStarterState = {
  waiting: boolean
}

export class WorkflowStarter extends React.Component {
  state: WorkflowStarterState = {
    waiting: false,
  }

  onClick = () => {
    this.setState(() => ({
      waiting: true
    }));
    Meteor.call(
      "start_workflow", (error: any) => {
        if (error) {
          notify(`Error: ${error}`)
        }
        notify(`New workflow instance created`)
        this.setState({ waiting: false });
      }
    )
  };

  render() {
    return (
      <div id={'worklow-actions'} className={'mb-4'}>
        {this.state.waiting &&
        <button className="btn btn-secondary disabled">
          <i className="fa fa-spinner fa-pulse"/>&nbsp;&nbsp;Creating a new PhD Assessment...
        </button>
        }
        {!this.state.waiting &&
        <button className="btn btn-secondary" onClick={() => this.onClick()}>
          <i className="fa fa-plus"/>&nbsp;&nbsp;New PhD Assessment
        </button>
        }
      </div>
    )
  }
}
