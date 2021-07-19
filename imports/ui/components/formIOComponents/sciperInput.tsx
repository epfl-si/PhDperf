/**
 * Custom FormIO sciper input that fetch user data from ldap
 *
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server';
import parse from 'html-react-parser';
import { Templates } from 'formiojs';


type NameFormProps = {
};

type NameFormState = {
  value: string;
};

class NameForm extends React.Component<NameFormProps, NameFormState> {
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
          <input type="text" value={this.state.value} onChange={() => alert('wtf')} />
        </label>
      </>
    );
  }
}

const inputTemplate = Templates.current.input.form;

export const newInputForm = (ctx: any) => ReactDOMServer.renderToString(
  (
    <div>
      <NameForm />
      { parse(inputTemplate(ctx)) }
    </div>
  )
)
