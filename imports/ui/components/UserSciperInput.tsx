/**
 * Custom FormIO sciper input that fetch user data from ldap
 *
 */
import React, { useState } from 'react'

import ReactDOMServer from 'react-dom/server';
import { render } from 'react-dom';
//import parse from 'html-react-parser';
import { Templates } from 'formiojs';


type NameFormProps = {
};

type NameFormState = {
  value: string;
};

export function UserSciperInput () {
  return (
    <>
      <label>
        name,:
        <input type="text" onChange={(e) => console.log(e.target.value) } />
      </label>
    </>
  );
}

export class UserSciperInputOLD extends React.Component<NameFormProps, NameFormState> {
  state: NameFormState = {
    // optional second annotation for better type inference
    value: '',
  };

  handleChange(event:any) {
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <>
        <label>
          Name {this.state.value}:
          <input type="text" value={this.state.value} onChange={() => alert('allo?')} />
        </label>
      </>
    );
  }
}

const inputTemplate = Templates.current.input.form;
