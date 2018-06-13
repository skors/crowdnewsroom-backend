import React from "react"
import { render } from 'react-dom';
import BucketPicker from "./bucketPicker";
import MultiSelectPicker from "./multiSelectPicker";


const bucketElement = document.getElementById("bucket-picker");
const id = bucketElement.getAttribute("response-id");

render(<BucketPicker responseId={id} />, bucketElement);

const assigneeElement = document.getElementById("assignee-picker");
render(<MultiSelectPicker responseId={id}
                          label="Assignees"
                          property="assignees"
                          itemToString={item => `${item.first_name} ${item.last_name}`}
                            />, assigneeElement);

const tagsElement = document.getElementById("tag-picker");
render(<MultiSelectPicker responseId={id}
                          label="Tags"
                          property="tags"
                          itemToString={item => item.name}
/>, tagsElement);
