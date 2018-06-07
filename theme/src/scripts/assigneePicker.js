import React, {Component} from 'react';
import { render } from 'react-dom';
import { MultiSelect } from "carbon-components-react";

let id = null;

class AssigneePicker extends Component {
  constructor(props){
    super(props);
    this.state = {
      tags: [],
      selectedTags: []
    };

    this.updateSelection = this.updateSelection.bind(this);
    this.update = this.update.bind(this);
  }

  componentDidMount(){
    const tagPromise =
      fetch("/forms/investigations/food-investigation/tags")
        .then(response => response.json());

    const responsePromise = fetch(`/forms/responses/${id}`)
      .then(response => response.json());

    Promise.all([tagPromise, responsePromise]).then(([tags, response]) => {
      const selectedTags = tags.filter(tag => response.tags.includes(tag.id));
      this.setState({tags, selectedTags})
    });
  }

  update(httpResponse){
    httpResponse.json()
      .then(response => {
        const selectedTags = this.state.tags.filter(tag => response.tags.includes(tag.id));
        this.setState({selectedTags});
      });
  }

  updateSelection({selectedItems}){
    fetch(`/forms/responses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({tags: selectedItems.map(tag => tag.id)}),
      headers: {
        'content-type': 'application/json'
      },
    }).then(this.update);
  }

  render(){
    if (!this.state.tags.length){
      return <div>Loading</div>
    }

    return <div>
      <MultiSelect
        label="Assignees"
        itemToString={item => item.name}
        initialSelectedItems={this.state.selectedTags}
        onChange={this.updateSelection}
        items={this.state.tags} />
      <ul>
        {this.state.selectedTags.map(tag => <li><div className="bx--tag bx--tag--ibm">{tag.name}</div></li>)}
      </ul>
    </div>

  }
}

const element = document.getElementById('assignee-picker');
id = element.getAttribute("response-id");
render(<AssigneePicker />, element);
