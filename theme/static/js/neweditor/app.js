$(document).foundation()

// Vue.http.options.emulateJSON = true;

// TODO:
// - required fields
// - nextButtonLabel

var formschema = [
  {
    schema: {
      title: "First slide",
      description: "We start here!",
      slug: "first-slide", 
      type: "object",
      properties: {
        firstName: {
          type: "string",
          title: "First name",
          default: "Chuck"
        },
        lastName: {
          type: "string",
          title: "Last name"
        },
      } 
    },
    conditions: {}
  },
  {
    schema: {
      title: "Second slide",
      description: "We end here!",
      slug: "second-slide", 
      "final": true,
      type: "object",
      properties: {
        age: {
          type: "integer",
          title: "Age"
        },
        bio: {
          type: "string",
          title: "Bio"
        },
        photo: {
          type: "file",
          title: "Photo",
        },
        telephone: {
          type: "string",
          title: "Telephone",
          minLength: 10
        },
      } 
    },
    conditions: {}
  },
];

var uischema = {
  bio: {
    "ui:widget": "textarea"
  }
};

var defaultNewField = {
  "title": "New field",
  "type": "string"
};

var defaultNewSlide = {
  schema: {
    title: "New slide",
    description: "I'm a new slide, fill me!",
    slug: "new-slide", 
    type: "object",
    properties: {
      dummy: {
        type: "string",
        title: "Dummy field"
      },
    } 
  },
  conditions: {}
};


var vm = new Vue({
  el: '#editor',
  name: 'editor',
  delimiters: ['${', '}'],
  data: {
    slides: formschema,
    uischema: uischema,
    activeSlide: null,
    editingField: null,
    formSlug: null,
    investigationId: null,
    postUrl: null,
    doneUrl: null,
  },
  beforeMount: function() {
    this.activeSlide = this.slides[0];
  },
  mounted: function() {
    this.getFormData();
  },
  computed: {
    isFirstSlide: function() {
      if (this.slides.indexOf(this.activeSlide) === 0) {
        return true;
      }
      return false;
    },
    isLastSlide: function() {
      if (this.slides.indexOf(this.activeSlide) == this.slides.length - 1) {
        return true;
      }
      return false;
    }
  },
  methods: {
    getFormData : function () {
      // form_slug is given in the HTML template, and set in a <script> tag there
      axios.get('/forms/forms/' + form_slug)
        .then(function (response) {
          vm.$set(vm.$data, 'investigationId',  response.data.investigation);
          console.log(response.data);
          vm.$set(vm.$data, 'postUrl', '/forms/forms/' + vm.investigationId + '/form_instances?limit=1');
          vm.$set(vm.$data, 'doneUrl', '/forms/admin/investigations/' + inv_slug + '/interviewers/' + form_slug + '#/form_instance');
          var form = document.getElementById('editor-hidden-form');
          console.log(vm.postUrl);
          axios.get(vm.postUrl)
            .then(function (response) {
              formjson = response.data.results[0].form_json;
              vm.$set(vm.$data, 'slides', response.data.results[0].form_json);
              vm.$set(vm.$data, 'uischema', response.data.results[0].ui_schema_json);
              vm.activeSlide = vm.slides[0];
              console.log(form);
            })
            .catch(function (error) {
              this.message = "getFormData - I get null";
            });
          });
        },
    sendFormData: function() {
      var formData = new FormData(document.getElementById('editor-hidden-form'));
      axios.post(this.postUrl, formData)
        .then(function (response) {
          if (response.status === 201) {
            window.location.href = vm.doneUrl;
          }
          console.log(response);
        });

    },

    removeSlide: function(ev, idx) {
      ev.preventDefault();
      this.slides.splice(idx, 1);
    },
    addSlide: function(ev) {
      ev.preventDefault();
      // make a deep copy of the default new slide
      var newSlide = Object.assign({}, defaultNewSlide);
      this.slides.push(newSlide);
      this.selectSlide(newSlide);
    },
    /*
    addFieldToSlide: function(ev, idx) {
      ev.preventDefault();
      var fieldSlug = 'field-' + Math.floor(Math.random() * 100) + 100;  
      // make a deep copy of the default new field
      var newField = Object.assign({}, defaultNewField);
      this.model.properties[fieldSlug] = newField;
      this.model.slides[idx].fields.push(fieldSlug);
    },
    */
    removeField: function(ev, fieldName) {
      ev.preventDefault();
      // remove field reference from slide
      // this.model.slides[idx].fields.splice(this.model.slides[idx].fields.indexOf(fieldName), 1);
      // remove the actual field object from model.properties
      delete this.activeSlide.schema.properties[fieldName];
    },
    updateRequiredField: function(ev, fieldName) {
      console.log(ev);
    },

    selectSlide: function(slide) {
      this.$set(this.$data, 'activeSlide', slide);
    },
    selectSlideByTitle: function(slideTitle) {
      var result = this.model.slides.find(function( slide ) { 
        return slide.title === slideTitle; 
      });
      this.$set(this.$data, 'activeSlide', slide);
    },
    selectPrevSlide: function() {
      var slide = this.slides[this.slides.indexOf(this.activeSlide) - 1];
      this.$set(this.$data, 'activeSlide', slide);
    },
    selectNextSlide: function() {
      var slide = this.slides[this.slides.indexOf(this.activeSlide) + 1];
      this.$set(this.$data, 'activeSlide', slide);
    },

    addField: function(slug, data) {
      // TODO: check if slug exists, change if it does
      this.activeSlide.schema.properties[slug] = data;
    },
    addTextInputField: function() {
      this.addField("text-input", {
        type: "string",
        title: "Text",
      });
    },
    addTextAreaField: function() {
      var slug = "text-area";
      this.addField(slug, {
        type: "string",
        title: "Comments",
      });
      if (!(slug in this.model.ui)) {
        this.model.ui[slug] = {};
      }
      this.model.ui[slug]['ui:widget'] = 'textarea';
    },
    addEmailInputField: function() {
      this.addField("email-input", {
        type: "string",
        format: "email",
        title: "Email",
      });
    },
    addFileUploadField: function() {
      this.addField("image-input", {
        type: "file",
        title: "Image upload",
      });
    },
    addImageUploadField: function() {
      this.addField("image-input", {
        type: "file",
        title: "File upload",
      });
    },


    ceEdit: function(ev, target, property) {
      // edit ContentEditable element
      this.$set(target, property, ev.target.innerText.replace(/\n/g, ' '));
    },
    cePressEnter: function(ev, target, property) {
      // press enter in ContentEditable element = save
      ev.preventDefault();
      this.ceEdit(ev, target, property);
      ev.target.blur();
    },
    ceButtonEdit: function(ev, choice) {
      choice.label = ev.target.innerText;
    },
    ceButtonPressEnter: function(ev, choice) {
      ev.preventDefault();
      choice.label = ev.target.innerText.replace(/\n/g, ' ');
      ev.target.blur();
    },






    removeBit: function(ev, index) {
      ev.preventDefault();
      this.tutorial_bits.splice(index, 1);
    },
    addTextBit: function() {
      this.tutorial_bits.unshift({ type: "text", text: "New line" });
    },
    addQuestionChoice: function(bit) {
      bit.choices.push({
        "label": "Another choice",
        "next": {
          "type": "text",
          "text": "You selected this choice, good!"
        }
      });
    },
    renderMarkdown: function(text) {
      return jQuery.renderMarkdown(text, false, true);
    },
    removeQuestionChoice: function(ev, bit, choice) {
      ev.preventDefault();
      bit.choices = bit.choices.filter( function(el) {
        return el.label !== choice.label;
      });
    },
    addQuestionBit: function() {
      this.tutorial_bits.unshift({ 
        type: "question-tutorial", 
        text: "What's the right answer?",
        choices: [
            {
                "label": "Right",
                "next": {
                    "type": "text",
                    "text": "Yes! You picked the right answer!"
                }
            },
            {
                "label": "Wrong",
                "next": {
                    "type": "text",
                    "text": "No, 'Right' was the correct answer."
                }
            }
        ],
      });
    },

    addImage: function(bit) {
      $input = $('#image-upload-form').find('input[name="file_source"]');
      // set up form to handle submit event differently
      $('#image-upload-form').submit(function (event) {
        event.preventDefault();
        var data = new FormData($('#image-upload-form').get(0));
        $.ajax({
          url: $(this).attr('action'),
          type: $(this).attr('method'),
          data: data,
          cache: false,
          processData: false,
          contentType: false,
          success: function(data) {
            console.log("success!");
            if (bit.type == 'text') {
              bit.type = 'image';
            }
            bit.media_url = data.url;
            // FIXME hack: we have to refresh the text field for the var to update
            bit.text = bit.text + " ";
            bit.text = bit.text.trim();
          }
        });
        return false;
      });
      // when image field changes (file selected), submit form
      $input.change( function() {
        $('#image-upload-form').submit();
      });

      // now, simulate click on file upload field for user to pick image
      $input.click();
    },
    removeImage: function(bit) {
      delete bit.media_url;
      if (bit.type == 'image') {
        bit.type = 'text';
      }
      // FIXME hack: we have to refresh the text field for the var to update
      bit.text = bit.text + " ";
      bit.text = bit.text.trim();
    },


    captureSpace: function(ev) {
      console.log(ev);
    },
    buttonClicked: function(ev) {
      // this deals with the Space key firing the onClick event
      // we want it to add an actual space
      // FIXME: multiple spaces don't work
      ev.preventDefault();
      if (!ev.x && !ev.y && !ev.clientX && !ev.clientY) {
        // it's a space press, not a mouse click
        insertHtmlAtCursor(' ');
      }
    }

    /*
    updateTutorialText: function(ev) {
      // click Update in tutorial text form
      ev.preventDefault();
      this.$refs.tutorialFormStatus.innerText = "Saving...";
      // catch form input values -- this ensures we also submit the csrf_token field
      var postdata = {};
      for (var i=0; i<ev.target.elements.length; i++) {
        var el = ev.target.elements[i];
        if (el.name) {
          postdata[el.name] = el.value;
        }
      }
      this.$http.post(setTutorialURL, postdata).then(function (response) {
        this.$refs.tutorialFormStatus.innerText = "Saved!";
      }, function (response) {
        this.$refs.tutorialFormStatus.innerText = "Error when saving :-(";
      });
    }
    */
  }
});
