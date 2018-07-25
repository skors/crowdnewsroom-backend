import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button, TextInput } from "carbon-components-react";
import {
  authorizedDELETE,
  authorizedFetch,
  authorizedPATCH,
  authorizedPOST
} from "./api";
import { kebabCase } from "lodash";

class Tag extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEdit: false,
      name: props.tag.name
    };

    this.save = this.save.bind(this);
    this.updateName = this.updateName.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
  }

  deleteTag(tagId) {
    authorizedDELETE(`/forms/tags/${tagId}`).then(() => this.props.updateCallback());
  }

  updateName(event) {
    this.setState({ name: event.target.value });
  }

  save() {
    this.setState({ isEdit: false });
    authorizedPATCH(`/forms/tags/${this.props.tag.id}`, {
      body: JSON.stringify({ name: this.state.name })
    }).then(() => this.props.updateCallback());
  }

  render() {
    return (
      <div>
        {this.state.isEdit ? (
          <input value={this.state.name} onChange={this.updateName} />
        ) : (
          this.state.name
        )}

        {this.state.isEdit ? (
          <button className="cnr--button-unstyled" onClick={this.save}>
            save
          </button>
        ) : (
          <button
            className="cnr--button-unstyled"
            onClick={() => this.setState({ isEdit: true })}
          >
            edit
          </button>
        )}

        <button
          className="cnr--button-unstyled"
          onClick={() => this.deleteTag(this.props.tag.id)}
        >
          delete
        </button>
      </div>
    );
  }
}

Tag.propTypes = {
  tag: PropTypes.object.isRequired,
};

function TagList({ tags, updateCallback }) {
  return (
    <ul className="bx--list--unordered">
      {tags.map(tag => (
        <li key={tag.id} className="bx--list__item">
          <Tag
            tag={tag}
            updateCallback={updateCallback}
          />
        </li>
      ))}
    </ul>
  );
}

TagList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateCallback: PropTypes.func.isRequired,
};



class AddTag extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      slug: ""
    };

    this.updateName = this.updateName.bind(this);
    this.submit = this.submit.bind(this);
  }

  updateName(event) {
    const name = event.target.value;
    const slug = kebabCase(name);
    this.setState({ name, slug });
  }

  submit() {
    this.props.callback(this.state);
  }

  render() {
    return (
      <div>
        <TextInput
          id="tagName"
          value={this.state.name}
          labelText="Name"
          onChange={this.updateName}
        />
        <Button onClick={this.submit}>Add</Button>
      </div>
    );
  }
}

AddTag.propTypes = {
  callback: PropTypes.func.isRequired,
};

export default class TagManagement extends Component {
  constructor(props) {
    super(props);
    const [match, slug] = window.location.pathname.match(
      /investigations\/([a-z-]+)/
    );
    this.state = {
      tags: [],
      slug: slug
    };

    this.addTag = this.addTag.bind(this);
    this.loadTags = this.loadTags.bind(this);
  }

  componentDidMount() {
    this.loadTags();
  }

  addTag(tag) {
    authorizedPOST(`/forms/investigations/${this.state.slug}/tags`, {
      body: JSON.stringify(tag)
    }).then(() => this.loadTags());
  }

  loadTags() {
    authorizedFetch(`/forms/investigations/${this.state.slug}/tags`).then(
      tags => {
        this.setState({ tags });
      }
    );
  }

  render() {
    return (
      <div>
        <AddTag callback={this.addTag} />
        <TagList tags={this.state.tags} updateCallback={this.loadTags} />
      </div>
    );
  }
}
