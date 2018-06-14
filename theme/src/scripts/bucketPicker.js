import React, {Component} from 'react';
import { DropdownV2 } from "carbon-components-react";
import {authorizedFetch, authorizedPUT} from "./api";

export default class BucketPicker extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentState: null
    };

    this.updateSelection = this.updateSelection.bind(this);
    this.update = this.update.bind(this);
  }

  componentDidMount(){
    console.log(this.props);
    const responsePromise = authorizedFetch(`/forms/responses/${this.props.responseId}`);
    responsePromise.then(formResponse => {
      this.setState({currentState: formResponse.status})
    })
  }

  update(updatedResponse){
      this.setState({currentState: updatedResponse.status})
  }

  updateSelection({selectedItem}){
    authorizedPUT(`/forms/responses/${this.props.responseId}`,
      {body: JSON.stringify({status: selectedItem.id})}
    ).then(this.update);
  }

  render(){
    if (!this.state.currentState){
      return <div>Loading</div>
    }

    const items = [{id: "S", text: "Inbox"}, {id: "V", text: "Verified"}, {id: "I", text: "Trash"}];

    return <DropdownV2
        itemToString={item => item.text}
        label="Bucket"
        items={items}
        initialSelectedItem={items.find(item => item.id === this.state.currentState)}
        onChange={this.updateSelection}
        />
  }
}

