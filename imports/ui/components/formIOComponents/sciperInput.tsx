/**
 * Custom FormIO sciper input that fetch user data from ldap
 *
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server';
import parse from 'html-react-parser';
import { Templates } from 'formiojs';

type UserSciperFieldProps = {
  formIOSciperField: any
};

type UserSciperFieldState = {
  value: string;
};

export class UserSciperField extends React.Component<UserSciperFieldProps, UserSciperFieldState> {
  constructor(props: UserSciperFieldProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state: UserSciperFieldState = {
    // optional second annotation for better type inference
    value: '',
  };

  handleChange(event:any) {
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <>
        <div>
          {this.state.value}
          <label>Sciper</label>
          <Input value={this.state.value} onChangeFn={this.handleChange} />
        </div>
        <div>
          <label>Or name</label>
          <Input onChangeFn={() => alert('you are changing !')} />
        </div>
      </>
    )
  }
}

export const sciperToUserField = (ctx: any) => ReactDOMServer.renderToString(
  (
    <div id={'myDehydratedElement'}>
      <UserSciperField formIOSciperField={ctx} />
    </div>
  )
)

// Check this in case we want to transform the html provided by FormIO to some React Elements
//import { Templates } from 'formiojs';
//{ parse(inputTemplate(ctx)) }
