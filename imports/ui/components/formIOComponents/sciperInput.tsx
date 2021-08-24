/**
 * Custom FormIO sciper input that fetch user data from ldap
 *
 */
import React from 'react'
import ReactDOMServer from 'react-dom/server';
import parse from 'html-react-parser';
import { Templates } from 'formiojs';
import {Input} from "epfl-sti-react-library"

const inputTemplate = Templates.current.input.form;

// Let's do some react hydration, as the responsibility to write down the inputs come from the
// formio templating feature
const sciperToUserField = (ctx: any) => {
  const originalField = parse(inputTemplate(ctx)) as JSX.Element[]

  let ctxReact = originalField.filter((x) => typeof x === 'object')

  if (ctxReact.length < 0 ) {
    throw new Error('Unable to find a valid formIO field to create the react one')
  }

  const originalFieldReacted = ctxReact[0]
  // fix react not being happy with a value not being a state
  const modifiedFieldReacted = React.cloneElement(
    originalFieldReacted,
    { defaultValue: originalFieldReacted?.props.value,
      value: ''
    }
  )

  // WIP : maybe connect/wrap a ref from this component to the original input
  // See https://reactjs.org/docs/integrating-with-other-libraries.html

  return ReactDOMServer.renderToString(
    (
      <>
        <div className={'hydrateMeElement'}>
          <UserSciperField originalFieldName={modifiedFieldReacted.props.name}/>
        </div>
      </>
    )
  )
}

Templates.current = {
  'input-programAssistantSciper': {
    form: sciperToUserField
  },
  'input-phdStudentSciper': {
    form: sciperToUserField
  },
  'input-thesisDirectorSciper': {
    form: sciperToUserField
  },
  'input-thesisCoDirectorSciper': {
    form: sciperToUserField
  },
  'input-programDirectorSciper': {
    form: sciperToUserField
  },
  'input-mentorSciper': {
    form: sciperToUserField
  },
};

type UserSciperFieldProps = {
  originalFieldName: string
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
          <input value={this.state.value} onChange={this.handleChange} name={`${this.props.originalFieldName}`} />
        </div>
        <div>
          <label>Or name</label>
          <Input onChangeFn={() => alert('you are changing !')} name={`${this.props.originalFieldName}`} />
        </div>
      </>
    )
  }
}
