import React, {Component} from 'react';
import { render } from 'react-dom';
import { MultiSelect } from "carbon-components-react";

let id = null;


const authorizedFetch = (url, settings) => fetch(url, Object.assign({credentials: 'same-origin'}, settings)).then(response => response.json());

const authroizedPUT = (url, settings) => {
  const csrfValue = document.cookie.split(';').find(c => c.indexOf("csrftoken") === 0).split("=")[1];
  const baseSettings = {
    method: "PATCH",
    headers: {
      'content-type': 'application/json',
      'X-CSRFToken': csrfValue,
    },
  };
  return authorizedFetch(url, Object.assign(baseSettings, settings));
};

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
      authorizedFetch("/forms/investigations/food-investigation/tags");

    const responsePromise = authorizedFetch(`/forms/responses/${id}`);

    Promise.all([tagPromise, responsePromise]).then(([tags, response]) => {
      const selectedTags = tags.filter(tag => response.tags.includes(tag.id));
      this.setState({tags, selectedTags})
    });
  }

  update(updatedResponse){
      const selectedTags = this.state.tags.filter(tag => updatedResponse.tags.includes(tag.id));
      this.setState({selectedTags});
  }

  updateSelection({selectedItems}){
    authroizedPUT(`/forms/responses/${id}`,
      {body: JSON.stringify({tags: selectedItems.map(tag => tag.id)})})
    .then(this.update);
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
